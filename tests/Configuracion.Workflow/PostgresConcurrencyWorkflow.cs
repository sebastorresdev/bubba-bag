using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using BubbaBag.Api;
using BubbaBag.Api.Middlewares;
using BubbaBag.Modules.GestionDatos.Api;
using BubbaBag.Modules.GestionDatos.Infrastructure.Database;
using BubbaBag.Modules.RecursosHumanos.Api;
using BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;
using BubbaBag.Modules.Seguridad.Api;
using BubbaBag.Modules.Seguridad.Application.Auth;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Seeders;
using BubbaBag.Modules.ServicioCampo.Api;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Ajustes;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

internal static class PostgresConcurrencyWorkflow
{
    public static async Task RunAsync(string connection)
    {
        var cs = new NpgsqlConnectionStringBuilder(connection);
        if (cs.Host != "127.0.0.1" || cs.Port != 55439 || cs.Database == null || !System.Text.RegularExpressions.Regex.IsMatch(cs.Database, "^bubbabag_concurrencia_test_[a-f0-9]{32}$"))
            throw new Exception("La prueba requiere una base nueva con prefijo seguro en la instancia temporal 127.0.0.1:55439.");
        var database = cs.Database;
        var adminCs = new NpgsqlConnectionStringBuilder(connection) { Database = "postgres" };
        await using var admin = new NpgsqlConnection(adminCs.ConnectionString); await admin.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{database}\"", admin)) await create.ExecuteNonQueryAsync();
        var checks = 0;
        void Check(bool ok, string message) { if (!ok) throw new Exception(message); checks++; }
        try
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
            builder.Logging.ClearProviders(); builder.WebHost.UseUrls("http://127.0.0.1:0");
            builder.Configuration["ConnectionStrings:sqldb"] = connection;
            builder.Configuration["JwtSettings:Secret"] = "concurrency-fixture-secret-with-more-than-32-bytes";
            builder.Configuration["JwtSettings:Issuer"] = "ConcurrencyFixture"; builder.Configuration["JwtSettings:Audience"] = "ConcurrencyFixture";
            builder.Services.AddDbContext<ServicioCampoDbContext>(o => o.UseNpgsql(connection));
            builder.Services.AddDbContext<SeguridadDbContext>(o => o.UseNpgsql(connection));
            builder.Services.AddDbContext<RecursosHumanosDbContext>(o => o.UseNpgsql(connection));
            builder.Services.AddDbContext<GestionDatosDbContext>(o => o.UseNpgsql(connection));
            builder.Services.AddBubbaBagServices(builder.Configuration);
            builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(Directory.GetCurrentDirectory(), ".artifacts", "concurrencia-keys"))).UseEphemeralDataProtectionProvider();
            builder.Services.AddServicioCampoModule(); builder.Services.AddRecursosHumanosModule(); builder.Services.AddGestionDatosModule();
            builder.Services.AddExceptionHandler<GlobalExceptionHandler>(); builder.Services.AddProblemDetails();
            builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
            await using var app = builder.Build(); app.UseExceptionHandler(); app.UseAuthentication(); app.UseAuthorization();
            app.MapSeguridadEndpoints(); app.MapAjustesEndpoints(); app.MapOrdenesTrabajoEndpoints(); app.MapGestionDatosEndpoints();
            Guid userId, almacenId, ubicacionId, productoId, serieId, ordenId, cierreId, cancelId, trabajoCancelId;
            await using (var scope = app.Services.CreateAsyncScope())
            {
                var services = scope.ServiceProvider;
                await services.GetRequiredService<SeguridadDbContext>().Database.MigrateAsync();
                await services.GetRequiredService<RecursosHumanosDbContext>().Database.MigrateAsync();
                await services.GetRequiredService<ServicioCampoDbContext>().Database.MigrateAsync();
                await services.GetRequiredService<GestionDatosDbContext>().Database.MigrateAsync();
                await CatalogoRolesSistema.AsegurarAsync(services);
                var user = await services.GetRequiredService<IAuthService>().RegisterAsync("concurrencia@fixture.invalid", "Pruebas123!", "Prueba", [Roles.SuperAdmin]);
                Check(user.IsSuccess, "Usuario aislado creado"); userId = user.Value;
                var db = services.GetRequiredService<ServicioCampoDbContext>();
                var sede = UnidadOrganizativa.Crear("CONC", "Sede pruebas"); var almacen = Almacen.CrearBodega("CONC", "Almacén pruebas", sede.Id);
                var ubicacion = UbicacionInventario.Crear(almacen.Id, "PRINCIPAL", "Principal", true);
                var (grupo, unidad) = GrupoUnidadMedida.Crear("Unidad pruebas", "Unidad");
                var p = Producto.Crear("CONC-P", "Normal", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id);
                var s = Producto.Crear("CONC-S", "Seriado", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id, esSerializado: true);
                var cliente = Cliente.Crear("CONC-CLI", "12345678", "Cliente", "Pruebas", "123", "Dirección", "150101", esClienteFacturacion: true);
                db.Ubigeos.Add(BubbaBag.Modules.ServicioCampo.Domain.Ubigeos.Ubigeo.Crear("150101", "Lima", "Lima", "Lima"));
                var recurso = Recurso.Crear("CONC-R", "Técnico", usuarioId: userId);
                var tipo = TipoOrdenTrabajo.Crear("Concurrencia", exigeFirmaCliente: false, exigeEvidenciasFotograficas: false);
                OrdenTrabajo Orden(string codigo) { var o = OrdenTrabajo.Crear(codigo, tipo.Id, userId, cliente.Id, cliente.Id); o.ProgramarVisita(codigo + "-V1", recurso.Id, DateOnly.FromDateTime(DateTime.UtcNow), null); return o; }
                var orden = Orden("CONC-O"); var cierre = Orden("CONC-CIERRE"); var cancelar = Orden("CONC-CANCEL");
                var trabajo = cierre.AgregarTrabajo("CONC-T", p.Id); trabajo.Completar();
                var pendiente = cancelar.AgregarTrabajo("CONC-PEND", p.Id); pendiente.AgregarTarea("Tarea pendiente");
                db.AddRange(sede, almacen, ubicacion, grupo, unidad, p, s, cliente, recurso, tipo, orden, cierre, cancelar);
                await db.SaveChangesAsync();
                (almacenId, ubicacionId, productoId, serieId, ordenId, cierreId, cancelId, trabajoCancelId) = (almacen.Id, ubicacion.Id, p.Id, s.Id, orden.Id, cierre.Id, cancelar.Id, pendiente.Id);
            }
            await app.StartAsync();
            var address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
            using var client = new HttpClient { BaseAddress = new Uri(address), Timeout = TimeSpan.FromSeconds(60) };
            var codigos = await Task.WhenAll(Enumerable.Range(0, 8).Select(async _ =>
            {
                await using var scope = app.Services.CreateAsyncScope();
                return await scope.ServiceProvider.GetRequiredService<BubbaBag.SharedKernel.ICodigoSecuencialService>()
                    .SiguienteCodigoAsync("PRU", "primera_secuencia", "prueba_secuencia_nueva");
            }));
            Check(codigos.Distinct().Count() == 8, "Creación simultánea de esquema y secuencia genera ocho códigos únicos");
            using (var login = await client.PostAsJsonAsync("/api/seguridad/login", new { email = "concurrencia@fixture.invalid", password = "Pruebas123!" }))
            { login.EnsureSuccessStatusCode(); using var json = JsonDocument.Parse(await login.Content.ReadAsStringAsync()); client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", json.RootElement.GetProperty("token").GetString()); }
            async Task<(HttpStatusCode Status, JsonElement Body)> Import(Guid id, string csv)
            {
                using var form = new MultipartFormDataContent(); form.Add(new StringContent("InventarioInicial"), "entityName"); form.Add(new StringContent(id.ToString()), "operacionId");
                form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes(csv)), "file", "concurrencia.csv");
                using var r = await client.PostAsync("/api/gestion-datos/execute", form); var text = await r.Content.ReadAsStringAsync();
                using var json = JsonDocument.Parse(text); return (r.StatusCode, json.RootElement.Clone());
            }
            async Task<decimal> Saldo(Guid producto, CondicionInventario condicion = CondicionInventario.Utilizable)
            { await using var scope = app.Services.CreateAsyncScope(); return await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().StocksAlmacen.Where(s => s.ProductoId == producto && s.UbicacionId == ubicacionId && s.Condicion == condicion).SumAsync(s => s.CantidadDisponible); }
            const string csvNormal = "Almacen,Producto,Cantidad\nCONC,CONC-P,2\n";
            var operacion = Guid.NewGuid(); var repetidas = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => Import(operacion, csvNormal)));
            Check(repetidas.All(r => r.Status == HttpStatusCode.OK && r.Body.GetProperty("id").GetGuid() == operacion), "8 envíos simultáneos devuelven la misma importación: " + string.Join(',', repetidas.Select(r => r.Status)));
            Check(await Saldo(productoId) == 2, "8 reintentos aumentan existencias una sola vez");
            var cargas = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Import(Guid.NewGuid(), csvNormal)));
            Check(cargas.All(r => r.Status == HttpStatusCode.OK) && await Saldo(productoId) == 10, "Cargas distintas simultáneas suman sin perder incrementos");
            Check((await Import(operacion, csvNormal.Replace(",2", ",7"))).Status == HttpStatusCode.Conflict && await Saldo(productoId) == 10, "Identificador reutilizado con otro archivo rechazado");
            using (var delete = await client.DeleteAsync("/api/gestion-datos/imports/" + operacion)) Check(delete.StatusCode == HttpStatusCode.NoContent, "Oculta historial terminado");
            Check((await Import(operacion, csvNormal)).Status == HttpStatusCode.OK && await Saldo(productoId) == 10, "Eliminar historial no habilita duplicación de existencias");
            var fraccion = await Import(Guid.NewGuid(), "Almacen,Producto,Cantidad,Series,Ubicacion\nCONC,CONC-S,1.5,FRACCION,UBICACION-INVALIDA\n");
            Check(fraccion.Status == HttpStatusCode.OK && fraccion.Body.GetProperty("totalFallidos").GetInt32() == 1, "Rechaza cantidad fraccionaria serializada");
            await using (var scope = app.Services.CreateAsyncScope()) Check(!await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().UbicacionesInventario.AnyAsync(u => u.Codigo == "UBICACION-INVALIDA"), "Fila inválida no crea ubicación");
            var defecto = await Import(Guid.NewGuid(), "Almacen,Producto,Cantidad,Series,Condicion\nCONC,CONC-S,1,DEFECTO,Defectuoso\n");
            Check(defecto.Status == HttpStatusCode.OK && await Saldo(serieId, CondicionInventario.Defectuoso) == 1, "Stock defectuoso correcto");
            await using (var scope = app.Services.CreateAsyncScope()) { var item = await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().ItemsSeriados.SingleAsync(i => i.NumeroSerie == "DEFECTO"); Check(item.Condicion == CondicionInventario.Defectuoso && item.Estado == EstadoItemSeriado.AveriadoEnAlmacen, "Serie defectuosa conserva condición y estado"); }
            var series = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Import(Guid.NewGuid(), "Almacen,Producto,Cantidad,Series\nCONC,CONC-S,1,SERIE-UNICA\n")));
            Check(series.All(r => r.Status == HttpStatusCode.OK) && series.Sum(r => r.Body.GetProperty("totalExitosos").GetInt32()) == 1 && await Saldo(serieId) == 1, "Solicitudes simultáneas sobre misma serie sólo ingresan una unidad");
            var rollbackId = Guid.NewGuid(); var antes = await Saldo(productoId);
            var roto = await Import(rollbackId, "Almacen,Producto,Cantidad,Observacion\nCONC,CONC-P,3,Normal\nCONC,CONC-P,4," + new string('x', 20000) + "\n");
            Check(roto.Status == HttpStatusCode.BadRequest && await Saldo(productoId) == antes, "Fallo SQL revierte existencias de todo el lote");
            await using (var scope = app.Services.CreateAsyncScope()) Check(!await scope.ServiceProvider.GetRequiredService<GestionDatosDbContext>().DataImportJobs.AnyAsync(j => j.Id == rollbackId), "Fallo SQL revierte también registro de importación");
            async Task<Guid> Ajuste(Guid producto, string[] numeros)
            {
                var input = new GuardarAjusteInput("Entrada", almacenId, ubicacionId, "2026-10-14", "Concurrencia", null, null, [new(producto, null, null, null, false, "Entrada", 1, 1, numeros.ToList(), null)]);
                using var r = await client.PostAsJsonAsync("/api/inventario/ajustes", input); r.EnsureSuccessStatusCode(); using var json = JsonDocument.Parse(await r.Content.ReadAsStringAsync()); return json.RootElement.GetProperty("id").GetGuid();
            }
            async Task<HttpStatusCode> Aplicar(Guid id) { using var r = await client.PostAsync($"/api/inventario/ajustes/{id}/aplicar", null); return r.StatusCode; }
            var a = await Ajuste(serieId, ["AJUSTE-UNICO"]); var mismo = await Task.WhenAll(Aplicar(a), Aplicar(a));
            Check(mismo.Count(s => s == HttpStatusCode.OK) == 1 && mismo.Count(s => s == HttpStatusCode.BadRequest) == 1 && await Saldo(serieId) == 2, "Dos aprobaciones del mismo ajuste aplican una sola vez");
            var a1 = await Ajuste(serieId, ["SERIE-CARRERA"]); var a2 = await Ajuste(serieId, ["SERIE-CARRERA"]); var choque = await Task.WhenAll(Aplicar(a1), Aplicar(a2));
            Check(choque.Count(s => s == HttpStatusCode.OK) == 1 && choque.Count(s => s == HttpStatusCode.BadRequest) == 1 && await Saldo(serieId) == 3, "Ajustes distintos con misma serie: un ganador sin saldo extra");
            var normales = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Ajuste(productoId, []))); antes = await Saldo(productoId);
            var incrementos = await Task.WhenAll(normales.Select(Aplicar));
            Check(incrementos.All(s => s is HttpStatusCode.OK or HttpStatusCode.BadRequest) && await Saldo(productoId) == antes + incrementos.Count(s => s == HttpStatusCode.OK), "Ajustes simultáneos no pierden incrementos ni dejan aplicaciones parciales");
            using var detalle = await client.GetAsync($"/api/serviciocampo/ordenes/{ordenId}"); using var dto = JsonDocument.Parse(await detalle.Content.ReadAsStringAsync()); var version = dto.RootElement.GetProperty("version").GetUInt32();
            string? versionRespuesta = null;
            async Task<HttpStatusCode> Editar(string nota)
            { using var req = new HttpRequestMessage(HttpMethod.Put, $"/api/serviciocampo/ordenes/{ordenId}"); req.Headers.TryAddWithoutValidation("If-Match", version.ToString()); req.Content = JsonContent.Create(new { observaciones = nota }); using var r = await client.SendAsync(req); if (r.IsSuccessStatusCode) versionRespuesta = r.Headers.ETag?.Tag.Trim('"'); return r.StatusCode; }
            var ediciones = await Task.WhenAll(Editar("Primera"), Editar("Segunda"));
            Check(ediciones.Count(s => s == HttpStatusCode.OK) == 1 && ediciones.Count(s => s == HttpStatusCode.Conflict) == 1, "Dos ediciones con misma versión: una guarda, otra recibe conflicto");
            await using (var scope = app.Services.CreateAsyncScope()) { var o = await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().OrdenesTrabajo.SingleAsync(o => o.Id == ordenId); Check(o.ObservacionesGenerales is "Primera" or "Segunda" && o.Version != version, "Observación persistida y versión renovada"); Check(versionRespuesta == o.Version.ToString(), "ETag contiene exactamente la versión del guardado confirmado"); }
            using (var sinVersion = await client.PutAsJsonAsync($"/api/serviciocampo/ordenes/{ordenId}", new { observaciones = "Sin versión" })) Check((int)sinVersion.StatusCode == 428, "No permite editar sin versión del registro");
            using (var iniciar = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{cierreId}/estado-sistema", new { nuevoEstadoSistema = "EnProgreso" })) Check(iniciar.IsSuccessStatusCode, "Transición válida a atención");
            using (var cerrar = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{cierreId}/estado-sistema", new { nuevoEstadoSistema = "Completado" })) Check(cerrar.StatusCode == HttpStatusCode.BadRequest, "Trabajo completado no omite descarga de materiales");
            await using (var scope = app.Services.CreateAsyncScope()) { var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>(); var o = await db.OrdenesTrabajo.SingleAsync(o => o.Id == cierreId); o.ConfirmarDescargaMaterialesAlmacen(); await db.SaveChangesAsync(); }
            using (var cerrar = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{cierreId}/estado-sistema", new { nuevoEstadoSistema = "Completado" })) Check(cerrar.IsSuccessStatusCode, "Cierre tras confirmar materiales");
            using (var reabrir = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{cierreId}/estado-sistema", new { nuevoEstadoSistema = "EnProgreso" })) Check(reabrir.StatusCode == HttpStatusCode.BadRequest, "No reabre orden finalizada");
            await using (var scope = app.Services.CreateAsyncScope()) { var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>(); var o = await db.OrdenesTrabajo.SingleAsync(o => o.Id == cierreId); o.Liquidar(); await db.SaveChangesAsync(); }
            using (var reabrir = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{cierreId}/estado-sistema", new { nuevoEstadoSistema = "EnProgreso" })) Check(reabrir.StatusCode == HttpStatusCode.BadRequest, "No reabre orden liquidada económicamente");
            await using (var scope = app.Services.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>();
                var original = await db.OrdenesTrabajo.Include(o => o.Visitas).SingleAsync(o => o.Id == ordenId);
                var tipoEvidencia = TipoOrdenTrabajo.Crear("Exige evidencia", exigeFirmaCliente: false, exigeEvidenciasFotograficas: true);
                var evidencia = OrdenTrabajo.Crear("CONC-EVIDENCIA", tipoEvidencia.Id, userId, original.ClienteFacturacionId, original.ClienteServicioId);
                evidencia.ProgramarVisita("CONC-EVIDENCIA-V1", original.Visitas.First().RecursoId, DateOnly.FromDateTime(DateTime.UtcNow), null);
                evidencia.CambiarEstadoSistema(EstadoSistema.EnProgreso); evidencia.AgregarTrabajo("CONC-EVID-T", productoId).Completar(); evidencia.ConfirmarDescargaMaterialesAlmacen();
                db.AddRange(tipoEvidencia, evidencia); await db.SaveChangesAsync();
                using var cerrar = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{evidencia.Id}/estado-sistema", new { nuevoEstadoSistema = "Completado" });
                Check(cerrar.StatusCode == HttpStatusCode.BadRequest, "Materiales confirmados no omiten evidencia obligatoria");
            }
            async Task<HttpStatusCode> Cancelar() { using var r = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{cancelId}/estado-sistema", new { nuevoEstadoSistema = "Cancelado", observaciones = "Cancelación de prueba" }); return r.StatusCode; }
            async Task<HttpStatusCode> CompletarTrabajo() { using var r = await client.PostAsync($"/api/serviciocampo/ordenes/{cancelId}/trabajos/{trabajoCancelId}/completar", null); return r.StatusCode; }
            var finales = await Task.WhenAll(Cancelar(), CompletarTrabajo()); Check(finales[0] == HttpStatusCode.OK && finales[1] == HttpStatusCode.BadRequest, "Cancelación simultánea no completa trabajo con tarea pendiente");
            await using (var scope = app.Services.CreateAsyncScope())
            {
                var o = await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().OrdenesTrabajo.Include(o => o.Visitas).Include(o => o.Trabajos).ThenInclude(t => t.Tareas).SingleAsync(o => o.Id == cancelId);
                Check(o.Estado == EstadoOrdenTrabajo.Cancelada && o.Visitas.All(v => v.Estado == EstadoVisita.Cancelada) && o.Trabajos.All(t => t.Estado == EstadoTrabajo.Cancelado && t.Tareas.All(x => x.Estado == EstadoTarea.Cancelada)), "Cancelación coherente de orden, visita, trabajo y tareas");
            }
            using (var reabrir = await client.PatchAsJsonAsync($"/api/serviciocampo/ordenes/{cancelId}/estado-sistema", new { nuevoEstadoSistema = "EnProgreso" })) Check(reabrir.StatusCode == HttpStatusCode.BadRequest, "No reabre orden cancelada");
            await app.StopAsync(); Console.WriteLine($"PostgreSQL: {checks} comprobaciones reales de concurrencia, transacciones, series, reintentos, versiones y estados correctas.");
        }
        finally
        {
            NpgsqlConnection.ClearAllPools();
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{database}\" WITH (FORCE)", admin); await drop.ExecuteNonQueryAsync();
        }
    }
}
