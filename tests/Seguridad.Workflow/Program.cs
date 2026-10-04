using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BubbaBag.Api;
using BubbaBag.Api.Services;
using BubbaBag.Modules.Seguridad.Api;
using BubbaBag.Modules.Seguridad.Application.Auth;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Seeders;
using BubbaBag.Modules.ServicioCampo.Api;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

// Sólo una base vacía y explícitamente denominada para pruebas. Nunca usa appsettings.
var connectionString = Environment.GetEnvironmentVariable("SEGURIDAD_TEST_CONNECTION") ?? throw new InvalidOperationException("Defina SEGURIDAD_TEST_CONNECTION a una base vacía dedicada.");
var connection = new NpgsqlConnectionStringBuilder(connectionString);
if (connection.Database is null || !connection.Database.StartsWith("seguridad_test_", StringComparison.Ordinal)) throw new InvalidOperationException("El nombre de base debe empezar con seguridad_test_.");
await using (var sql = new NpgsqlConnection(connectionString))
{
    await sql.OpenAsync();
    await using var command = new NpgsqlCommand("SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')", sql);
    if (Convert.ToInt64(await command.ExecuteScalarAsync()) != 0) throw new InvalidOperationException("La base de pruebas debe estar vacía.");
}
var builder = WebApplication.CreateBuilder();
builder.Logging.ClearProviders();
builder.Logging.AddConsole().SetMinimumLevel(LogLevel.Error);
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(Directory.GetCurrentDirectory(), ".artifacts", "seguridad-test-keys"))).UseEphemeralDataProtectionProvider();
builder.Configuration["JwtSettings:Secret"] = "security-workflow-fixture-secret-longer-than-32-bytes";
builder.Configuration["JwtSettings:Issuer"] = "Workflow";
builder.Configuration["JwtSettings:Audience"] = "Workflow";
builder.Configuration["JwtSettings:ExpiryMinutes"] = "30";
var falloTransitorio = new FalloTransitorioRegistro();
builder.Services.AddDbContext<SeguridadDbContext>(o => o.UseNpgsql(connectionString, postgres => postgres.EnableRetryOnFailure(2, TimeSpan.FromMilliseconds(100), null)).AddInterceptors(falloTransitorio));
builder.Services.AddBubbaBagServices(builder.Configuration);
builder.Services.AddServicioCampoModule();
builder.Services.AddDbContext<BubbaBag.Modules.ServicioCampo.Infrastructure.Database.ServicioCampoDbContext>(o => o.UseNpgsql(connectionString));
builder.Services.AddScoped<BubbaBag.Modules.Seguridad.Application.Vistas.IVistasService, BubbaBag.Modules.Seguridad.Infrastructure.Vistas.VistasService>();
await using var app = builder.Build();
app.UseAuthentication(); app.UseAuthorization(); app.MapSeguridadEndpoints();
// Las políticas se evalúan antes de requerir dispatcher/contextos de los módulos.
app.MapServicioCampoEndpoints();
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();
    if (!db.Database.CreateExecutionStrategy().RetriesOnFailure) throw new Exception("Las pruebas deben usar la estrategia de reintentos de PostgreSQL, como Aspire.");
    await db.Database.EnsureCreatedAsync();
    await CatalogoRolesSistema.AsegurarAsync(scope.ServiceProvider);
    if (await db.Users.AnyAsync()) throw new Exception("El catálogo técnico no debe crear usuarios.");
}
app.Urls.Add("http://127.0.0.1:55519");
await app.StartAsync();
using var client = new HttpClient { BaseAddress = new Uri("http://127.0.0.1:55519") };
var checks = 0;
void Check(bool value, string label) { if (!value) throw new Exception(label); checks++; Console.WriteLine("OK " + label); }
async Task<JsonElement> Body(HttpResponseMessage response) => JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();
async Task<string> Login(string email, string password = "Pruebas123!")
{
    var response = await client.PostAsJsonAsync("/api/seguridad/login", new { email, password });
    Check(response.IsSuccessStatusCode, "Login válido " + email);
    return (await Body(response)).GetProperty("token").GetString()!;
}
void Token(string? token) => client.DefaultRequestHeaders.Authorization = token == null ? null : new AuthenticationHeaderValue("Bearer", token);
Check((await client.GetAsync("/api/seguridad/usuarios")).StatusCode == HttpStatusCode.Unauthorized, "Usuarios requiere login");
Check((await Body(await client.GetAsync("/api/seguridad/configuracion-inicial"))).GetProperty("requiereConfiguracion").GetBoolean(), "Instalación vacía requiere configuración manual");
var setupData = new { email = "primero@pruebas.invalid", password = "Pruebas123!", nombreCompleto = "Administrador de prueba aislada" };
var setups = await Task.WhenAll(client.PostAsJsonAsync("/api/seguridad/configuracion-inicial", setupData), client.PostAsJsonAsync("/api/seguridad/configuracion-inicial", setupData));
Check(setups.Count(r => r.IsSuccessStatusCode) == 1, "Configuración simultánea crea un solo administrador");
Check(!(await Body(await client.GetAsync("/api/seguridad/configuracion-inicial"))).GetProperty("requiereConfiguracion").GetBoolean(), "Configuración cerrada después del primer usuario");
var adminToken = await Login(setupData.email); Token(adminToken);
var me = await Body(await client.GetAsync("/api/seguridad/sesion"));
var adminId = me.GetProperty("usuario").GetProperty("id").GetGuid();
Check(me.GetProperty("permisos").EnumerateArray().Any(p => p.GetString() == Permissions.Seguridad.UsuariosGestionar), "Sesión entrega permisos reales");
Check((await client.PutAsJsonAsync($"/api/seguridad/usuarios/{adminId}/roles", new { roles = Array.Empty<string>() })).StatusCode == HttpStatusCode.BadRequest, "No permite quitar último administrador");
Check((await client.PatchAsJsonAsync($"/api/seguridad/usuarios/{adminId}/estado", new { esActivo = false })).StatusCode == HttpStatusCode.BadRequest, "No permite desactivar último administrador");
Check((await client.PostAsJsonAsync("/api/seguridad/usuarios", new { email = "invalido", password = "x", nombreCompleto = "", roles = new[] { "Inventado" } })).StatusCode == HttpStatusCode.BadRequest, "Rechaza registro inválido");
var created = await client.PostAsJsonAsync("/api/seguridad/usuarios", new { email = "operador@pruebas.invalid", password = "Pruebas123!", nombreCompleto = "Operador aislado", roles = new[] { Roles.InventarioAlmacenero } });
Check(created.IsSuccessStatusCode, "Crea usuario con rol de almacenero");
var operatorId = (await Body(created)).GetProperty("usuarioId").GetGuid();
var operatorToken = await Login("operador@pruebas.invalid"); Token(operatorToken);
Check((await client.GetAsync("/api/seguridad/usuarios")).StatusCode == HttpStatusCode.Forbidden, "Almacenero no puede administrar cuentas");
Check((await client.PostAsJsonAsync("/api/inventario/productos/", new { })).StatusCode == HttpStatusCode.Forbidden, "Almacenero no puede modificar catálogo");
Check((await client.GetAsync("/api/crm/clientes/")).StatusCode == HttpStatusCode.Forbidden, "Inventario no da acceso CRM");
Token(adminToken);
Check((await client.PutAsJsonAsync($"/api/seguridad/usuarios/{operatorId}", new { nombreCompleto = "Nombre que no debe persistir", email = "operador@pruebas.invalid", roles = new[] { "Inventado" } })).StatusCode == HttpStatusCode.BadRequest, "Rechaza edición y roles inválidos juntos");
Check((await Body(await client.GetAsync($"/api/seguridad/usuarios/{operatorId}"))).GetProperty("nombreCompleto").GetString() == "Operador aislado", "Edición rechazada conserva datos");
Check((await client.PutAsJsonAsync($"/api/seguridad/usuarios/{operatorId}/roles", new { roles = new[] { Roles.InventarioAdmin, Roles.ServicioCampoTecnico } })).IsSuccessStatusCode, "Asigna múltiples roles");
Token(operatorToken); Check((await client.GetAsync("/api/seguridad/sesion")).StatusCode == HttpStatusCode.Unauthorized, "Cambio de roles revoca JWT previo");
operatorToken = await Login("operador@pruebas.invalid"); Token(adminToken);
await client.PatchAsJsonAsync($"/api/seguridad/usuarios/{operatorId}/estado", new { esActivo = false });
Token(operatorToken); Check((await client.GetAsync("/api/seguridad/sesion")).StatusCode == HttpStatusCode.Unauthorized, "Inactivo pierde sesión");
Check(!(await client.PostAsJsonAsync("/api/seguridad/login", new { email = "operador@pruebas.invalid", password = "Pruebas123!" })).IsSuccessStatusCode, "Inactivo no puede iniciar sesión");
Token(adminToken); await client.PatchAsJsonAsync($"/api/seguridad/usuarios/{operatorId}/estado", new { esActivo = true });
operatorToken = await Login("operador@pruebas.invalid"); Token(adminToken);
var passwordReset = await client.PutAsJsonAsync($"/api/seguridad/usuarios/{operatorId}/password", new { nuevaPassword = "NuevaPrueba123!" });
Check(passwordReset.IsSuccessStatusCode, "Restablece contraseña (" + passwordReset.StatusCode + "): " + await passwordReset.Content.ReadAsStringAsync());
Token(operatorToken); Check((await client.GetAsync("/api/seguridad/sesion")).StatusCode == HttpStatusCode.Unauthorized, "Cambio de contraseña revoca sesión");
Check(!(await client.PostAsJsonAsync("/api/seguridad/login", new { email = "operador@pruebas.invalid", password = "Pruebas123!" })).IsSuccessStatusCode, "Contraseña anterior rechazada");
await Login("operador@pruebas.invalid", "NuevaPrueba123!");
Token(adminToken);
await using (var scope = app.Services.CreateAsyncScope())
{
    var accessor = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
    accessor.HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity([new(System.Security.Claims.ClaimTypes.Role, Roles.SuperAdmin)], "fixture")) };
    var provider = scope.ServiceProvider.GetServices<BubbaBag.Modules.GestionDatos.Application.Services.IEntityImportProvider>().OfType<UsuariosImportProvider>().Single();
    var result = await provider.ImportAsync("Usuario", [new() { ["Email"] = "masivo@pruebas.invalid", ["NombreCompleto"] = "Carga manual aislada", ["Roles"] = Roles.ServicioCampoTecnico }, new() { ["Email"] = "fallido@pruebas.invalid", ["NombreCompleto"] = "No persistir", ["Roles"] = "Inventado" }], "Error");
    Check(result.TotalExitosos == 1 && result.TotalFallidos == 1, "Importación informa éxito y error por fila");
    var db = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();
    var imported = await db.Users.SingleAsync(u => u.Email == "masivo@pruebas.invalid");
    Check(!imported.EsActivo && imported.PasswordHash == null, "Carga masiva crea usuario inactivo sin contraseña");
    Check(!await db.Users.AnyAsync(u => u.Email == "fallido@pruebas.invalid"), "Rol inválido no deja cuenta parcial");
    var auth = scope.ServiceProvider.GetRequiredService<IAuthService>();
    Check((await auth.CambiarPasswordAsync(imported.Id, "ManualPrueba123!")).IsSuccess && (await auth.CambiarEstadoAsync(imported.Id, true)).IsSuccess, "Permite configurar y activar cuenta importada");
}
await Login("masivo@pruebas.invalid", "ManualPrueba123!");
for (var i = 0; i < 5; i++) await client.PostAsJsonAsync("/api/seguridad/login", new { email = "masivo@pruebas.invalid", password = "Incorrecta" });
Check(!(await client.PostAsJsonAsync("/api/seguridad/login", new { email = "masivo@pruebas.invalid", password = "ManualPrueba123!" })).IsSuccessStatusCode, "Bloquea tras cinco intentos fallidos");
Token(adminToken);
falloTransitorio.Activar();
var reintentado = await client.PostAsJsonAsync("/api/seguridad/usuarios", new { email = "reintento@pruebas.invalid", password = "Pruebas123!", nombreCompleto = "Registro con fallo transitorio", roles = new[] { Roles.InventarioAlmacenero } });
Check(reintentado.IsSuccessStatusCode, "Reintenta la transacción completa tras un fallo transitorio real del proveedor");
Check(falloTransitorio.Fallos == 1, "El fallo se inyectó después de insertar el usuario");
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();
    var registrados = await db.Users.Where(u => u.Email == "reintento@pruebas.invalid").ToListAsync();
    Check(registrados.Count == 1, "El reintento conserva una sola cuenta, sin duplicados");
    Check(await db.UserRoles.CountAsync(r => r.UserId == registrados.Single().Id) == 1, "El reintento confirma usuario y rol juntos");
}
if (Environment.GetEnvironmentVariable("SEGURIDAD_UI_TEST") == "1")
{
    Console.WriteLine("Servidor de UI aislado listo. ENTER termina las pruebas.");
    await Task.Run(() => Console.ReadLine());
}
await app.StopAsync();
Console.WriteLine($"Seguridad: {checks} comprobaciones correctas; base de pruebas aislada.");
