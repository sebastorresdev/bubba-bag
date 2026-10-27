using ProgrammingCar.Modules.GestionDatos.Api;
using ProgrammingCar.Modules.GestionDatos.Infrastructure.Database;
using ProgrammingCar.Api.Middlewares;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ProgrammingCar.Api;
using ProgrammingCar.Modules.RecursosHumanos.Api;
using ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database;
using ProgrammingCar.Modules.Seguridad.Api;
using ProgrammingCar.Modules.Seguridad.Application.Auth;
using ProgrammingCar.Modules.Seguridad.Domain.Entities;
using ProgrammingCar.Modules.Seguridad.Infrastructure.Persistence;
using ProgrammingCar.Modules.Seguridad.Infrastructure.Persistence.Seeders;
using ProgrammingCar.Modules.ServicioCampo.Api;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Organizacion;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database;
using ProgrammingCar.Modules.ServicioCampo.Infrastructure.Services;
using ProgrammingCar.SharedKernel.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

// HTTP y JWT reales sobre bases efímeras; nunca usa la base operativa ni sus credenciales.
if (Environment.GetEnvironmentVariable("CONCURRENCIA_TEST_CONNECTION") is { Length: > 0 } conexionPruebas)
{
    await PostgresConcurrencyWorkflow.RunAsync(conexionPruebas); return;
}
var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
builder.Logging.ClearProviders();
builder.Logging.AddConsole().SetMinimumLevel(LogLevel.Error);
builder.WebHost.UseUrls("http://127.0.0.1:0");
builder.Services.AddDataProtection().UseEphemeralDataProtectionProvider();
builder.Configuration["JwtSettings:Secret"] = "configuration-fixture-secret-with-at-least-32-bytes";
builder.Configuration["JwtSettings:Issuer"] = "ConfigurationWorkflow";
builder.Configuration["JwtSettings:Audience"] = "ConfigurationWorkflow";
builder.Configuration["JwtSettings:ExpiryMinutes"] = "30";
var database = Guid.NewGuid().ToString();
builder.Services.AddDbContext<SeguridadDbContext>(o => o.UseInMemoryDatabase(database + "-seguridad"));
builder.Services.AddDbContext<ServicioCampoDbContext>(o => o.UseInMemoryDatabase(database + "-campo"));
builder.Services.AddDbContext<RecursosHumanosDbContext>(o => o.UseInMemoryDatabase(database + "-rrhh"));
builder.Services.AddProgrammingCarServices(builder.Configuration);
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(Directory.GetCurrentDirectory(), ".artifacts", "configuracion-test-keys", database)))
    .UseEphemeralDataProtectionProvider();
builder.Services.AddDbContext<GestionDatosDbContext>(o => o.UseInMemoryDatabase(database + "-gestion"));
builder.Services.AddGestionDatosModule();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>(); builder.Services.AddProblemDetails();
builder.Services.AddServicioCampoModule();
builder.Services.AddRecursosHumanosModule();
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
await using var app = builder.Build();
app.UseExceptionHandler(); app.UseAuthentication(); app.UseAuthorization();
app.MapSeguridadEndpoints(); app.MapEmpresaEndpoints(); app.MapSucursalesEndpoints(); app.MapOrganizacionEndpoints(); app.MapAlmacenesEndpoints();
app.MapAjustesEndpoints(); app.MapOrdenesTrabajoEndpoints(); app.MapRecursosHumanosEndpoints(); app.MapGestionDatosEndpoints();
var userIds = new Dictionary<string, Guid>();
await using (var scope = app.Services.CreateAsyncScope())
{
    await CatalogoRolesSistema.AsegurarAsync(scope.ServiceProvider);
    var auth = scope.ServiceProvider.GetRequiredService<IAuthService>();
    foreach (var role in Roles.Fijos)
    {
        var result = await auth.RegisterAsync(role.ToLowerInvariant() + "@fixture.invalid", "Pruebas123!", role, [role]);
        if (result.IsFailure) throw new Exception(result.Error);
        userIds[role] = result.Value;
    }
    foreach (var (name, permissions) in new (string, string[])[] {
        ("ConsultaSeguridad", [Permissions.Seguridad.Acceso]),
        ("SoloPresentacion", [Permissions.Configuracion.EmpresaPresentacionGestionar]),
        ("SoloFiscal", [Permissions.Configuracion.EmpresaDatosFiscalesGestionar]),
        ("SedesPersonalizado", [Permissions.Configuracion.SucursalesGestionar]),
        ("SoloEstadoSedes", [Permissions.Configuracion.SucursalesEstadoGestionar]),
    })
    {
        var role = await auth.CrearRolAsync(name, name, "Configuración", "Fixture", permissions);
        if (role.IsFailure) throw new Exception(role.Error);
        var user = await auth.RegisterAsync(name.ToLowerInvariant() + "@fixture.invalid", "Pruebas123!", name, [name]);
        if (user.IsFailure) throw new Exception(user.Error);
        userIds[name] = user.Value;
    }
}
await app.StartAsync();
var address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
using var client = new HttpClient { BaseAddress = new Uri(address) };
var checks = 0;
void Check(bool ok, string message) { if (!ok) throw new Exception(message); checks++; }
async Task<JsonElement> Body(HttpResponseMessage response) => JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();
async Task<HttpResponseMessage> Send(HttpMethod method, string path, object? data = null) {
    using var request = new HttpRequestMessage(method, path);
    if (data != null) request.Content = JsonContent.Create(data);
    return await client.SendAsync(request);
}
async Task<string> Login(string role) {
    var response = await client.PostAsJsonAsync("/api/seguridad/login", new { email = role.ToLowerInvariant() + "@fixture.invalid", password = "Pruebas123!" });
    Check(response.IsSuccessStatusCode, "Login " + role);
    var token = (await Body(response)).GetProperty("token").GetString()!;
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    return token;
}
async Task Status(HttpMethod method, string path, HttpStatusCode expected, object? data, string message) {
    using var response = await Send(method, path, data);
    Check(response.StatusCode == expected, message + ": " + response.StatusCode + " " + await response.Content.ReadAsStringAsync());
}
const string company = "/api/configuracion/empresa";
var companyData = new { razonSocial = "Empresa Oficial de Prueba", nombreComercial = "Oficial", ruc = "20123456789", direccionFiscal = "Dirección oficial", telefono = "123456", email = "oficial@fixture.invalid", logoBase64 = (string?)null, piePaginaDocumentos = "Pie oficial" };
await Status(HttpMethod.Get, company, HttpStatusCode.Unauthorized, null, "Consulta requiere sesión");
await Status(HttpMethod.Put, company, HttpStatusCode.Unauthorized, companyData, "Escritura requiere sesión");

// La primera consulta no inserta configuración: leer para un documento no modifica datos.
await Login(Roles.InventarioAlmacenero);
await Status(HttpMethod.Get, company, HttpStatusCode.OK, null, "Almacenero consulta empresa para documentos");
await using (var scope = app.Services.CreateAsyncScope())
    Check(!await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().ConfiguracionEmpresas.AnyAsync(), "Consultar empresa no crea datos");
await Login(Roles.Gerencia);
await Status(HttpMethod.Put, company, HttpStatusCode.OK, companyData, "Gerencia guarda empresa completa");
foreach (var role in Roles.Fijos.Concat(["ConsultaSeguridad"])) {
    await Login(role);
    await Status(HttpMethod.Get, company, HttpStatusCode.OK, null, role + " consulta empresa");
    await Status(HttpMethod.Put, company, role is Roles.Gerencia or Roles.SuperAdmin ? HttpStatusCode.OK : HttpStatusCode.Forbidden,
        companyData, role + " permisos de edición fiscal y presentación");
}

// Un permiso parcial no autoriza sobrescribir el otro grupo ni usar el antiguo PUT completo.
await Login("SoloPresentacion");
await Status(HttpMethod.Patch, company + "/presentacion", HttpStatusCode.OK,
    new { telefono = "654321", email = "imagen@fixture.invalid", logoBase64 = (string?)null, piePaginaDocumentos = "Pie nuevo", ruc = "ATAQUE", razonSocial = "ATAQUE" }, "Presentación ignora campos fiscales inyectados");
var official = await Body(await client.GetAsync(company));
Check(official.GetProperty("ruc").GetString() == companyData.ruc && official.GetProperty("razonSocial").GetString() == companyData.razonSocial
    && official.GetProperty("telefono").GetString() == "654321", "Cambiar presentación conserva los datos fiscales");
await Status(HttpMethod.Patch, company + "/datos-fiscales", HttpStatusCode.Forbidden, companyData, "Presentación no modifica datos fiscales");
await Status(HttpMethod.Put, company, HttpStatusCode.Forbidden, companyData, "Presentación no usa actualización completa");
await Login("SoloFiscal");
await Status(HttpMethod.Patch, company + "/datos-fiscales", HttpStatusCode.OK,
    new { razonSocial = "Fiscal Actualizada", nombreComercial = "Fiscal", ruc = companyData.ruc, direccionFiscal = "Dirección fiscal nueva", telefono = "ATAQUE", piePaginaDocumentos = "ATAQUE" }, "Fiscal ignora campos de presentación inyectados");
official = await Body(await client.GetAsync(company));
Check(official.GetProperty("telefono").GetString() == "654321" && official.GetProperty("piePaginaDocumentos").GetString() == "Pie nuevo", "Cambiar datos fiscales conserva presentación");
await Status(HttpMethod.Patch, company + "/presentacion", HttpStatusCode.Forbidden, companyData, "Fiscal no cambia presentación");
await Status(HttpMethod.Put, company, HttpStatusCode.Forbidden, companyData, "Fiscal no usa actualización completa");

// Ambas representaciones de sucursales usan la misma matriz.
foreach (var prefix in new[] { "/api/configuracion/sucursales", "/api/serviciocampo/unidades-organizativas" }) {
    var estadoGuardado = prefix.Contains("unidades-organizativas") ? HttpStatusCode.OK : HttpStatusCode.NoContent;
    foreach (var role in Roles.Fijos) {
        await Login(role);
        await Status(HttpMethod.Get, prefix, HttpStatusCode.OK, null, role + " consulta " + prefix);
        using var created = await Send(HttpMethod.Post, prefix, new { codigo = "S" + checks, nombre = "Sede " + role });
        var canManage = role is Roles.SuperAdmin or Roles.Gerencia or Roles.RrhhAdmin;
        Check(created.StatusCode == (canManage ? HttpStatusCode.Created : HttpStatusCode.Forbidden), role + " crear " + prefix);
        if (!canManage) continue;
        var id = (await Body(created)).GetProperty("id").GetGuid();
        await Status(HttpMethod.Put, prefix + "/" + id, HttpStatusCode.NoContent, new { nombre = "Sede editada" }, role + " edita datos generales");
        await Status(HttpMethod.Put, prefix + "/" + id, role == Roles.RrhhAdmin ? HttpStatusCode.Forbidden : HttpStatusCode.NoContent,
            new { nombre = "Sede principal", esSedePrincipal = true }, role + " cambia sede principal");
        await Status(HttpMethod.Patch, prefix + "/" + id + "/estado", role == Roles.RrhhAdmin ? HttpStatusCode.Forbidden : estadoGuardado,
            new { activo = false }, role + " desactiva sede");
    }
    await Login(Roles.Gerencia);
    using var main = await Send(HttpMethod.Post, prefix, new { codigo = "P" + checks, nombre = "Principal", esSedePrincipal = true });
    Check(main.StatusCode == HttpStatusCode.Created, "Gerencia crea principal");
    var principalId = (await Body(main)).GetProperty("id").GetGuid();
    await Login(Roles.RrhhAdmin);
    await Status(HttpMethod.Put, prefix + "/" + principalId, HttpStatusCode.NoContent, new { nombre = "Principal editada por RRHH" }, "RRHH edita sin cambiar la jerarquía");
    Check((await Body(await client.GetAsync(prefix + "/" + principalId))).GetProperty("esSedePrincipal").GetBoolean(), "Campo omitido preserva sede principal");
    await Status(HttpMethod.Put, prefix + "/" + principalId, HttpStatusCode.Forbidden, new { nombre = "ATAQUE", esSedePrincipal = false }, "RRHH no desmarca principal con PUT");
    await Status(HttpMethod.Post, prefix, HttpStatusCode.Forbidden, new { codigo = "ATAQUE", nombre = "ATAQUE", esSedePrincipal = true }, "RRHH no crea principal con POST");
    Check((await Body(await client.GetAsync(prefix + "/" + principalId))).GetProperty("nombre").GetString() == "Principal editada por RRHH", "Solicitud rechazada conserva datos");
    await Login("SedesPersonalizado");
    using var custom = await Send(HttpMethod.Post, prefix, new { codigo = "C" + checks, nombre = "Sede personalizada" });
    Check(custom.StatusCode == HttpStatusCode.Created, "Rol personalizado crea sin roles técnicos fijos");
    var customId = (await Body(custom)).GetProperty("id").GetGuid();
    await Status(HttpMethod.Patch, prefix + "/" + customId + "/estado", HttpStatusCode.Forbidden, new { activo = false }, "Crear/editar no permite desactivar");
    await Login("SoloEstadoSedes");
    await Status(HttpMethod.Patch, prefix + "/" + customId + "/estado", estadoGuardado, new { activo = false }, "Permiso de estado funciona sin permiso de edición");
    await Status(HttpMethod.Put, prefix + "/" + customId, HttpStatusCode.Forbidden, new { nombre = "ATAQUE" }, "Permiso de estado no edita datos generales");
}

// Importación: el permiso antiguo de catálogos no elude la separación ni el de sede principal.
await using (var scope = app.Services.CreateAsyncScope()) {
    var accessor = scope.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
    void Principal(string role) => accessor.HttpContext = new DefaultHttpContext { User = new System.Security.Claims.ClaimsPrincipal(
        new System.Security.Claims.ClaimsIdentity([new(System.Security.Claims.ClaimTypes.NameIdentifier, userIds[role].ToString()), new(System.Security.Claims.ClaimTypes.Role, role)], "fixture")) };
    var provider = new ServicioCampoImportProvider(scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>(), scope.ServiceProvider.GetRequiredService<ProgrammingCar.SharedKernel.ICurrentUser>());
    Principal(Roles.InventarioAdmin);
    Check(!provider.GetDescriptors().Any(e => e.EntityName == "UnidadOrganizativa"), "Catálogos de inventario no ofrece importar sedes");
    var denied = false;
    try { await provider.ImportAsync("UnidadOrganizativa", [new() { ["Codigo"] = "IMPORT", ["Nombre"] = "No permitido" }], "Upsert"); }
    catch (UnauthorizedAccessException) { denied = true; }
    Check(denied, "Importación directa exige administrar sucursales");
    Principal(Roles.RrhhAdmin);
    var result = await provider.ImportAsync("UnidadOrganizativa", [new() { ["Codigo"] = "IMP", ["Nombre"] = "Importada" }, new() { ["Codigo"] = "IMPP", ["Nombre"] = "Principal rechazada", ["EsSedePrincipal"] = "true" }], "Upsert");
    Check(result.TotalExitosos == 1 && result.TotalFallidos == 1, "Importación respeta permiso separado de principal por fila");
    Principal(Roles.Gerencia);
    result = await provider.ImportAsync("UnidadOrganizativa", [new() { ["Codigo"] = "IMPPR", ["Nombre"] = "Principal importada", ["EsSedePrincipal"] = "true" }], "Upsert");
    Check(result.TotalExitosos == 1, "Gerencia importa principal");
    Principal(Roles.RrhhAdmin);
    result = await provider.ImportAsync("UnidadOrganizativa", [new() { ["Codigo"] = "IMPPR", ["Nombre"] = "Nombre actualizado" }], "Upsert");
    Check(result.TotalExitosos == 1 && (await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().UnidadesOrganizativas.SingleAsync(u => u.Codigo == "IMPPR")).EsSedePrincipal,
        "Importación sin columna de jerarquía preserva principal");
    accessor.HttpContext = null;
}

// Un almacenero autorizado conserva la generación de PDF sin permisos de edición de empresa.
Guid transferId;
await using (var scope = app.Services.CreateAsyncScope()) {
    var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>();
    var sede = UnidadOrganizativa.Crear("PDF", "Sede PDF");
    var origen = Almacen.CrearBodega("PDF-A", "Origen PDF", sede.Id); var destino = Almacen.CrearBodega("PDF-B", "Destino PDF", sede.Id);
    var uo = UbicacionInventario.Crear(origen.Id, "PRINCIPAL", "Principal", true); var ud = UbicacionInventario.Crear(destino.Id, "PRINCIPAL", "Principal", true);
    var (grupo, unidad) = GrupoUnidadMedida.Crear("Unidades PDF", "Unidad");
    var producto = Producto.Crear("PDF", "Producto PDF", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id);
    var t = Transferencia.Crear("TRF-PDF", origen.Id, destino.Id, sede.Id, sede.Id, ModalidadTransferencia.Inmediata, userIds[Roles.InventarioAlmacenero], "Almacenero", null, "GR-PDF", uo.Id, ud.Id);
    t.AgregarLinea(producto.Id, 1, unidadMedidaId: unidad.Id, unidadMedidaNombre: unidad.Nombre); t.Despachar(userIds[Roles.InventarioAlmacenero], "Almacenero", "GR-PDF");
    db.UnidadesOrganizativas.Add(sede); db.Almacenes.AddRange(origen, destino); db.UbicacionesInventario.AddRange(uo, ud);
    db.GruposUnidadMedida.Add(grupo); db.UnidadesMedida.Add(unidad); db.Productos.Add(producto); db.Transferencias.Add(t);
    db.UsuarioAlmacenAutorizaciones.Add(UsuarioAlmacenAutorizacion.Crear(userIds[Roles.InventarioAlmacenero], origen.Id));
    await db.SaveChangesAsync(); transferId = t.Id;
}
await Login(Roles.InventarioAlmacenero);
using (var pdf = await client.GetAsync($"/api/inventario/transferencias/{transferId}/cargo-pdf")) {
    Check(pdf.IsSuccessStatusCode && pdf.Content.Headers.ContentType?.MediaType == "application/pdf", "Almacenero autorizado genera PDF con información oficial");
    Check((await pdf.Content.ReadAsByteArrayAsync()).AsSpan().StartsWith("%PDF"u8), "Documento descargado es un PDF");
}
await Status(HttpMethod.Put, company, HttpStatusCode.Forbidden, companyData, "Generar PDF no autoriza modificar empresa");

// Actualización de instalaciones existentes: completar presets y revocar sólo sesiones afectadas.
var oldGerenciaToken = await Login(Roles.Gerencia);
var customToken = await Login("SoloPresentacion");
await using (var scope = app.Services.CreateAsyncScope()) {
    var manager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<Rol>>();
    var role = (await manager.FindByNameAsync(Roles.Gerencia))!;
    foreach (var claim in (await manager.GetClaimsAsync(role)).Where(c => c.Type == "permission" && c.Value.StartsWith("configuracion."))) await manager.RemoveClaimAsync(role, claim);
    RolePermissions.SetRolePermissions(Roles.Gerencia, RolePermissions.GetSystemPermissionsForRole(Roles.Gerencia).Where(p => !p.StartsWith("configuracion.")));
    await CatalogoRolesSistema.AsegurarAsync(scope.ServiceProvider);
    Check((await manager.GetClaimsAsync(role)).Any(c => c.Value == Permissions.Configuracion.EmpresaDatosFiscalesGestionar), "Catálogo existente recibe los permisos nuevos");
    Check(RolePermissions.RoleHasPermission(Roles.Gerencia, Permissions.Configuracion.SucursalesEstadoGestionar), "Permisos nuevos quedan disponibles tras sincronización");
    var custom = (await manager.FindByNameAsync("SoloPresentacion"))!;
    Check((await manager.GetClaimsAsync(custom)).Count(c => c.Type == "permission") == 1, "Actualización respeta permisos de roles personalizados");
}
client.DefaultRequestHeaders.Authorization = new("Bearer", oldGerenciaToken);
await Status(HttpMethod.Get, "/api/seguridad/sesion", HttpStatusCode.Unauthorized, null, "Cambio de perfil fijo revoca la sesión anterior");
client.DefaultRequestHeaders.Authorization = new("Bearer", customToken);
await Status(HttpMethod.Get, "/api/seguridad/sesion", HttpStatusCode.OK, null, "Rol no modificado mantiene su sesión");
await Login(Roles.Gerencia);
await Status(HttpMethod.Put, company, HttpStatusCode.OK, companyData, "Gerencia funciona después de actualizar el catálogo");
await AltaPrioridadWorkflow.RunAsync(app, client, userIds);
await app.StopAsync();
Console.WriteLine($"Configuración: {checks} comprobaciones HTTP/JWT correctas (InMemory), incluida generación real de PDF.");
