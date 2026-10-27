using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ProgrammingCar.Modules.GestionDatos.Domain;
using ProgrammingCar.Modules.GestionDatos.Infrastructure.Database;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Empleados;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Organizacion;
using ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database;
using ProgrammingCar.Modules.Seguridad.Application.Auth;
using ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Ajustes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos;
using ProgrammingCar.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using ProgrammingCar.Modules.ServicioCampo.Domain.Organizacion;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Recursos;
using ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database;
using ProgrammingCar.SharedKernel.Authorization;
using ProgrammingCar.SharedKernel;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

internal static class AltaPrioridadWorkflow
{
    public static async Task RunAsync(WebApplication app, HttpClient client, Dictionary<string, Guid> ids)
    {
        var checks = 0;
        void Check(bool ok, string message) { if (!ok) throw new Exception(message); checks++; }
        async Task<JsonElement> Body(HttpResponseMessage r) => JsonDocument.Parse(await r.Content.ReadAsStringAsync()).RootElement.Clone();
        async Task<HttpResponseMessage> Send(HttpMethod method, string path, object? data = null)
        {
            using var r = new HttpRequestMessage(method, path);
            if (method == HttpMethod.Put && path.StartsWith("/api/serviciocampo/ordenes/"))
            {
                using var detalle = await client.GetAsync("/api/serviciocampo/ordenes/" + path.Split('/')[4]);
                if (detalle.IsSuccessStatusCode) r.Headers.TryAddWithoutValidation("If-Match", (await Body(detalle)).GetProperty("version").ToString());
            }
            if (data != null) r.Content = JsonContent.Create(data);
            return await client.SendAsync(r);
        }
        async Task Status(HttpMethod method, string path, HttpStatusCode expected, object? data, string message)
        {
            using var r = await Send(method, path, data);
            Check(r.StatusCode == expected, message + ": " + r.StatusCode + " " + await r.Content.ReadAsStringAsync());
        }
        async Task Login(string name)
        {
            using var r = await client.PostAsJsonAsync("/api/seguridad/login", new { email = name.ToLowerInvariant() + "@fixture.invalid", password = "Pruebas123!" });
            Check(r.IsSuccessStatusCode, "Login " + name);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", (await Body(r)).GetProperty("token").GetString());
        }
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var auth = scope.ServiceProvider.GetRequiredService<IAuthService>();
            foreach (var (name, permissions) in new (string, string[])[] {
                ("OperadorA", [Permissions.Inventario.Acceso, Permissions.Inventario.Operar]),
                ("AprobadorA", [Permissions.Inventario.Acceso, Permissions.Inventario.AjustesAprobar]),
                ("AprobadorSinAlcance", [Permissions.Inventario.Acceso, Permissions.Inventario.AjustesAprobar]),
                ("TecnicoA", [Permissions.ServicioCampo.Acceso, Permissions.ServicioCampo.OrdenesVerAsignadas, Permissions.ServicioCampo.OrdenesOperarCampo]),
                ("TecnicoB", [Permissions.ServicioCampo.Acceso, Permissions.ServicioCampo.OrdenesVerAsignadas, Permissions.ServicioCampo.OrdenesOperarCampo]),
                ("Programador", [Permissions.ServicioCampo.Acceso, Permissions.ServicioCampo.OrdenesVerTodas, Permissions.ServicioCampo.OrdenesAsignar]),
                ("Cerrador", [Permissions.ServicioCampo.Acceso, Permissions.ServicioCampo.OrdenesVerTodas, Permissions.ServicioCampo.OrdenesCerrar]),
                ("GestorOrdenes", [Permissions.ServicioCampo.Acceso, Permissions.ServicioCampo.OrdenesVerTodas, Permissions.ServicioCampo.OrdenesCrear]),
                ("RrhhConsulta", [Permissions.Rrhh.Acceso, Permissions.Rrhh.ColaboradoresVer]),
                ("RrhhGestion", [Permissions.Rrhh.Acceso, Permissions.Rrhh.ColaboradoresVer, Permissions.Rrhh.ColaboradoresGestionar, Permissions.Rrhh.CatalogosGestionar]),
                ("RrhhConfidencial", [Permissions.Rrhh.Acceso, Permissions.Rrhh.ColaboradoresVer, Permissions.Rrhh.ColaboradoresGestionar, Permissions.Rrhh.SalariosConfidencial]),
                ("ImportadorSedes", [Permissions.Configuracion.SucursalesGestionar, Permissions.GestionDatos.Importar, Permissions.GestionDatos.HistorialVer]),
                ("HistorialSedes", [Permissions.Configuracion.SucursalesGestionar, Permissions.GestionDatos.HistorialVer]),
                ("GestorHistorialSedes", [Permissions.Configuracion.SucursalesGestionar, Permissions.GestionDatos.HistorialVer, Permissions.GestionDatos.HistorialVerTodas, Permissions.GestionDatos.HistorialEliminar]),
            })
            {
                var role = await auth.CrearRolAsync(name, name, "Pruebas", "Fixture", permissions);
                Check(role.IsSuccess, "Crear rol personalizado " + name);
                var user = await auth.RegisterAsync(name.ToLowerInvariant() + "@fixture.invalid", "Pruebas123!", name, [name]);
                Check(user.IsSuccess, "Crear usuario " + name); ids[name] = user.Value;
            }
            Check((await auth.ObtenerCatalogoPermisosAsync()).Value.Select(p => p.Codigo).ToHashSet().SetEquals(Permissions.GetAll()), "Cada permiso tiene descripción en el catálogo");
        }

        Guid almacenA, almacenB, ubicacionA, ubicacionB, productoId, serieId, ordenA, ordenB, recursoB, cargoId, departamentoId, empleadoId;
        Guid propio, ajeno, deOtraArea, procesando;
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>();
            var sede = UnidadOrganizativa.Crear("ALTA", "Sede de pruebas");
            var a = Almacen.CrearBodega("ALTA-A", "Almacén A", sede.Id);
            var b = Almacen.CrearBodega("ALTA-B", "Almacén B", sede.Id);
            var ua = UbicacionInventario.Crear(a.Id, "PRINCIPAL", "Principal A", true);
            var ub = UbicacionInventario.Crear(b.Id, "PRINCIPAL", "Principal B", true);
            var (grupo, unidad) = GrupoUnidadMedida.Crear("Alta unidad", "Unidad");
            var p = Producto.Crear("ALTA-P", "Producto normal", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id);
            var s = Producto.Crear("ALTA-S", "Producto serializado", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id, esSerializado: true);
            db.AddRange(sede, a, b, ua, ub, grupo, unidad, p, s);
            foreach (var name in new[] { "OperadorA", "AprobadorA" }) db.UsuarioAlmacenAutorizaciones.Add(UsuarioAlmacenAutorizacion.Crear(ids[name], a.Id, esSupervisor: true));
            db.UsuarioAlmacenAutorizaciones.Add(UsuarioAlmacenAutorizacion.Crear(ids["AprobadorSinAlcance"], a.Id));
            var ra = Recurso.Crear("ALTA-RA", "Técnico A", usuarioId: ids["TecnicoA"]);
            var rb = Recurso.Crear("ALTA-RB", "Técnico B", usuarioId: ids["TecnicoB"]);
            var tipo = TipoOrdenTrabajo.Crear("Prueba de alcance", exigeFirmaCliente: false, exigeEvidenciasFotograficas: false);
            var cliente = ProgrammingCar.Modules.ServicioCampo.Domain.Clientes.Cliente.Crear("ALTA-CLI", "87654321", "Cliente", "Pruebas", "123456", "Dirección", "150101", esClienteFacturacion: true); db.Add(cliente);
            var oa = OrdenTrabajo.Crear("ALTA-OA", tipo.Id, ids[Roles.SuperAdmin], cliente.Id, cliente.Id);
            var ob = OrdenTrabajo.Crear("ALTA-OB", tipo.Id, ids[Roles.SuperAdmin], cliente.Id, cliente.Id);
            oa.ProgramarVisita("ALTA-OA-V1", ra.Id, new DateOnly(2026, 10, 14), null);
            ob.ProgramarVisita("ALTA-OB-V1", rb.Id, new DateOnly(2026, 10, 14), null);
            db.AddRange(ra, rb, tipo, oa, ob); await db.SaveChangesAsync();
            (almacenA, almacenB, ubicacionA, ubicacionB, productoId, serieId, ordenA, ordenB, recursoB) = (a.Id, b.Id, ua.Id, ub.Id, p.Id, s.Id, oa.Id, ob.Id, rb.Id);
            var rrhh = scope.ServiceProvider.GetRequiredService<RecursosHumanosDbContext>();
            var dep = Departamento.Crear("Pruebas RRHH", null);
            var cargo = Cargo.Crear("Cargo confidencial", dep.Id, 2500);
            var emp = Empleado.Registrar("Nombre original", "Apellido", "DNI", "12345678");
            emp.ActualizarPlanilla(3000, "PEN", true, "AFP", "CUSPP123"); emp.ActualizarDatosBancarios("Banco", "123456", "987654");
            rrhh.AddRange(dep, cargo, emp); await rrhh.SaveChangesAsync();
            (cargoId, departamentoId, empleadoId) = (cargo.Id, dep.Id, emp.Id);
            var gd = scope.ServiceProvider.GetRequiredService<GestionDatosDbContext>();
            var j1 = DataImportJob.Iniciar("propio.csv", "UnidadOrganizativa", 20, "Upsert", false, "autor", ids["ImportadorSedes"]); j1.Finalizar(1, 1, 0);
            var j2 = DataImportJob.Iniciar("ajeno.csv", "UnidadOrganizativa", 20, "Upsert", false, "autor", ids["HistorialSedes"]); j2.Finalizar(1, 1, 0);
            var j3 = DataImportJob.Iniciar("usuarios.csv", "Usuario", 20, "Upsert", false, "autor", ids["ImportadorSedes"]); j3.Finalizar(1, 1, 0);
            var j4 = DataImportJob.Iniciar("proceso.csv", "UnidadOrganizativa", 20, "Upsert", false, "autor", ids["ImportadorSedes"]);
            gd.AddRange(j1, j2, j3, j4); await gd.SaveChangesAsync(); (propio, ajeno, deOtraArea, procesando) = (j1.Id, j2.Id, j3.Id, j4.Id);
        }
        GuardarAjusteInput Datos(Guid almacen, Guid ubicacion, Guid producto, decimal cantidad = 1, List<string>? series = null, string tipo = "Entrada") =>
            new(tipo, almacen, ubicacion, "2026-10-14", "Prueba de integridad", null, null, [new(producto, null, null, null, false, tipo, cantidad, 1, series ?? [], null)]);
        async Task<Guid> Crear(GuardarAjusteInput datos)
        {
            using var r = await Send(HttpMethod.Post, "/api/inventario/ajustes", datos);
            Check(r.StatusCode == HttpStatusCode.Created, "Crear ajuste autorizado: " + await r.Content.ReadAsStringAsync());
            return (await Body(r)).GetProperty("id").GetGuid();
        }
        const string ajustes = "/api/inventario/ajustes";
        await Login(Roles.SuperAdmin); var ajusteB = await Crear(Datos(almacenB, ubicacionB, productoId));
        await Login("OperadorA"); var ajusteA = await Crear(Datos(almacenA, ubicacionA, productoId));
        using (var r = await client.GetAsync(ajustes)) Check((await Body(r)).EnumerateArray().All(x => x.GetProperty("almacenId").GetGuid() == almacenA), "Listado filtra almacenes autorizados");
        await Status(HttpMethod.Get, ajustes + "/" + ajusteB, HttpStatusCode.Forbidden, null, "No consulta ajuste ajeno");
        await Status(HttpMethod.Put, ajustes + "/" + ajusteB, HttpStatusCode.Forbidden, Datos(almacenA, ubicacionA, productoId), "No traslada ajuste ajeno a su almacén");
        await Status(HttpMethod.Delete, ajustes + "/" + ajusteB, HttpStatusCode.Forbidden, null, "No elimina ajuste ajeno");
        await Status(HttpMethod.Post, ajustes, HttpStatusCode.Forbidden, Datos(almacenB, ubicacionB, productoId), "No crea fuera de su alcance");
        await Status(HttpMethod.Post, ajustes, HttpStatusCode.BadRequest, Datos(almacenA, ubicacionB, productoId), "Ubicación de otro almacén rechazada");
        await Status(HttpMethod.Post, ajustes + "/" + ajusteA + "/aplicar", HttpStatusCode.Forbidden, null, "Supervisor de almacén necesita permiso global de aprobar");
        await Login("AprobadorSinAlcance");
        await Status(HttpMethod.Post, ajustes + "/" + ajusteA + "/aplicar", HttpStatusCode.Forbidden, null, "Permiso global necesita supervisión en el almacén");
        await Login("AprobadorA");
        await Status(HttpMethod.Post, ajustes + "/" + ajusteB + "/aplicar", HttpStatusCode.Forbidden, null, "Aprobador no aplica en otro almacén");
        await Status(HttpMethod.Post, ajustes + "/" + ajusteA + "/aplicar", HttpStatusCode.OK, null, "Aprobación separada funciona sin permiso para registrar");
        await Status(HttpMethod.Post, ajustes + "/" + ajusteA + "/aplicar", HttpStatusCode.BadRequest, null, "Repetir aprobación no duplica stock");
        await Login("OperadorA");
        await Status(HttpMethod.Post, ajustes, HttpStatusCode.BadRequest, Datos(almacenA, ubicacionA, serieId, 1.5m, ["ALTA-001"]), "Serie requiere cantidad entera");
        await Status(HttpMethod.Post, ajustes, HttpStatusCode.BadRequest, Datos(almacenA, ubicacionA, serieId, 2, ["ALTA-001", "alta-001"]), "Series repetidas rechazan el borrador");
        var serieEntrada = await Crear(Datos(almacenA, ubicacionA, serieId, 1, ["ALTA-001"]));
        await Login("AprobadorA"); await Status(HttpMethod.Post, ajustes + "/" + serieEntrada + "/aplicar", HttpStatusCode.OK, null, "Entrada serializada válida");
        await Login("OperadorA"); var duplicado = await Crear(Datos(almacenA, ubicacionA, serieId, 1, ["ALTA-001"]));
        await Login("AprobadorA"); await Status(HttpMethod.Post, ajustes + "/" + duplicado + "/aplicar", HttpStatusCode.BadRequest, null, "Serie existente no incrementa stock");
        await Login(Roles.SuperAdmin); var salidaAjena = await Crear(Datos(almacenB, ubicacionB, serieId, 1, ["ALTA-001"], "Salida"));
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>();
            var stock = StockAlmacen.Crear(ubicacionB, serieId); stock.AumentarStock(1); db.Add(stock); await db.SaveChangesAsync();
        }
        await Status(HttpMethod.Post, ajustes + "/" + salidaAjena + "/aplicar", HttpStatusCode.BadRequest, null, "Serie de otra ubicación no se da de baja");
        await Login("OperadorA");
        var mixto = Datos(almacenA, ubicacionA, productoId) with { Lineas = [new(productoId, null, null, null, false, "Entrada", 5, 1, [], null), new(serieId, null, null, null, true, "Entrada", 1, 1, ["ALTA-001"], null)] };
        var multi = await Crear(mixto); await Login("AprobadorA");
        await Status(HttpMethod.Post, ajustes + "/" + multi + "/aplicar", HttpStatusCode.BadRequest, null, "Error en segunda línea no aplica la primera");
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>();
            Check((await db.StocksAlmacen.SingleAsync(s => s.UbicacionId == ubicacionA && s.ProductoId == productoId)).CantidadDisponible == 1, "Rechazos conservan saldo de producto normal");
            Check((await db.StocksAlmacen.SingleAsync(s => s.UbicacionId == ubicacionA && s.ProductoId == serieId)).CantidadDisponible == 1 && await db.ItemsSeriados.CountAsync(s => s.ProductoId == serieId) == 1, "Una serie corresponde a una unidad");
            var serie = await db.ItemsSeriados.SingleAsync(s => s.NumeroSerie == "ALTA-001");
            serie.DespacharEnTransito(Guid.NewGuid()); await db.SaveChangesAsync();
        }
        await Login("OperadorA"); var salidaTransito = await Crear(Datos(almacenA, ubicacionA, serieId, 1, ["ALTA-001"], "Salida"));
        await Login("AprobadorA"); await Status(HttpMethod.Post, ajustes + "/" + salidaTransito + "/aplicar", HttpStatusCode.BadRequest, null, "Serie en tránsito no se da de baja");
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>();
            var serie = await db.ItemsSeriados.SingleAsync(s => s.NumeroSerie == "ALTA-001");
            serie.Ubicar(ubicacionA, (await db.Almacenes.SingleAsync(a => a.Id == almacenA)).Tipo);
            await db.SaveChangesAsync();
        }
        await Status(HttpMethod.Post, ajustes + "/" + salidaTransito + "/aplicar", HttpStatusCode.OK, null, "Serie disponible sale correctamente después de recepción");
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>();
            Check((await db.StocksAlmacen.SingleAsync(s => s.UbicacionId == ubicacionA && s.ProductoId == serieId)).CantidadDisponible == 0, "Salida válida actualiza saldo serializado");
            Check((await db.ItemsSeriados.SingleAsync(s => s.NumeroSerie == "ALTA-001")).UbicacionActualId == null, "Salida válida retira serie de ubicación");
            Check(await db.MovimientosInventario.CountAsync(m => m.ProductoId == serieId) == 2, "Sólo entrada y salida válidas generan Kardex serializado");
            (await db.UsuarioAlmacenAutorizaciones.SingleAsync(a => a.UsuarioId == ids["AprobadorA"] && a.AlmacenId == almacenA)).Desactivar(); await db.SaveChangesAsync();
        }
        await Status(HttpMethod.Get, ajustes + "/" + duplicado, HttpStatusCode.Forbidden, null, "Revocación de almacén afecta sesión ya emitida");
        await Status(HttpMethod.Post, ajustes + "/" + duplicado + "/aplicar", HttpStatusCode.Forbidden, null, "Revocación impide aprobar inmediatamente");

        const string ordenes = "/api/serviciocampo/ordenes";
        await Login("TecnicoA");
        using (var r = await client.GetAsync(ordenes)) { var rows = await Body(r); Check(rows.GetArrayLength() == 1 && rows[0].GetProperty("id").GetGuid() == ordenA, "Técnico sólo lista asignación propia"); }
        await Status(HttpMethod.Get, ordenes + "/" + ordenA, HttpStatusCode.OK, null, "Detalle propio permitido");
        await Status(HttpMethod.Get, ordenes + "/" + ordenB, HttpStatusCode.NotFound, null, "Detalle de otro técnico oculto");
        await Status(HttpMethod.Post, ordenes + "/" + ordenB + "/trabajos/" + Guid.NewGuid() + "/completar", HttpStatusCode.Forbidden, new { }, "Operación de campo ajena denegada antes de buscar trabajo");
        await Login("GestorOrdenes");
        await Status(HttpMethod.Put, ordenes + "/" + ordenA, HttpStatusCode.OK, new { observaciones = "Edición ordinaria" }, "Gestionar orden no obliga a programarla");
        await Status(HttpMethod.Put, ordenes + "/" + ordenA, HttpStatusCode.Forbidden, new { recursoTecnicoId = recursoB, fechaProgramada = "2026-10-15" }, "Gestionar orden no concede reasignación");
        await Login("Programador");
        await Status(HttpMethod.Patch, ordenes + "/" + ordenA + "/estado-sistema", HttpStatusCode.Forbidden, new { nuevoEstadoSistema = "Completado" }, "Programador no cierra órdenes");
        await Status(HttpMethod.Patch, ordenes + "/" + ordenA + "/estado-sistema", HttpStatusCode.Forbidden, new { nuevoEstadoSistema = "Cancelado" }, "Programador no cancela órdenes");
        await Status(HttpMethod.Post, ordenes + "/" + ordenA + "/programar", HttpStatusCode.OK, new { recursoTecnicoId = recursoB, fechaProgramada = "2026-10-15" }, "Programador reasigna orden");
        await Login("TecnicoA"); await Status(HttpMethod.Get, ordenes + "/" + ordenA, HttpStatusCode.NotFound, null, "Visita antigua no conserva acceso tras reasignación");
        await Login("TecnicoB"); await Status(HttpMethod.Get, ordenes + "/" + ordenA, HttpStatusCode.OK, null, "Nuevo técnico recibe acceso");
        await using (var postgresDesign = new ServicioCampoDbContext(new DbContextOptionsBuilder<ServicioCampoDbContext>()
            .UseNpgsql("Host=localhost;Database=design_only;Username=design_only;Password=design_only").Options))
        {
            var sql = ProgrammingCar.Modules.ServicioCampo.Application.OrdenesTrabajo.OrdenesAcceso.Consultables(postgresDesign, new TecnicoPrueba(ids["TecnicoB"])).ToQueryString();
            Check(sql.Contains("max(", StringComparison.OrdinalIgnoreCase) && sql.Contains("UsuarioId"), "Filtro real de asignación se traduce a SQL PostgreSQL sin consultar una base");
        }
        await Login("Cerrador");
        await Status(HttpMethod.Patch, ordenes + "/" + ordenA + "/estado-sistema", HttpStatusCode.Forbidden, new { nuevoEstadoSistema = "EnProgreso" }, "Cierre no concede programación");
        await Status(HttpMethod.Patch, ordenes + "/" + ordenA + "/estado-sistema", HttpStatusCode.OK, new { nuevoEstadoSistema = "Cancelado" }, "Cierre autorizado separado");

        await Login("RrhhConsulta");
        await Status(HttpMethod.Get, "/api/rrhh/empleados", HttpStatusCode.OK, null, "Rol personalizado consulta RRHH");
        using (var r = await client.GetAsync("/api/rrhh/empleados/" + empleadoId)) { var e = await Body(r); Check(e.GetProperty("salarioBase").ValueKind == JsonValueKind.Null && e.GetProperty("cuentaBancaria").ValueKind == JsonValueKind.Null, "Consulta oculta salario y cuenta bancaria"); }
        foreach (var path in new[] { "/api/rrhh/cargos/" + cargoId, "/api/rrhh/cargos", "/api/rrhh/catalogos", "/api/rrhh/departamentos/" + departamentoId })
        {
            using var r = await client.GetAsync(path); Check(r.IsSuccessStatusCode && !(await r.Content.ReadAsStringAsync()).Contains("2500"), "Catálogo oculta salario referencial en " + path);
        }
        await Status(HttpMethod.Post, "/api/rrhh/departamentos", HttpStatusCode.Forbidden, new { nombre = "No autorizado" }, "Consulta no administra catálogos");
        object EmpleadoDatos(string nombre, decimal? salario = null, string? cuenta = null) => new { id = empleadoId, nombres = nombre, apellidos = "Apellido", tipoDocumento = "DNI", numeroDocumento = "12345678", salarioBase = salario, cuentaBancaria = cuenta, tieneAsignacionFamiliar = false, estado = "Activo" };
        await Login("RrhhGestion");
        await Status(HttpMethod.Put, "/api/rrhh/empleados/" + empleadoId, HttpStatusCode.Forbidden, EmpleadoDatos("Suplantado", 9000, "999"), "Inyección de salario y banco denegada");
        await using (var scope = app.Services.CreateAsyncScope()) Check((await scope.ServiceProvider.GetRequiredService<RecursosHumanosDbContext>().Empleados.SingleAsync(e => e.Id == empleadoId)).Nombres == "Nombre original", "Rechazo no cambia nombre ni datos del empleado");
        await Status(HttpMethod.Put, "/api/rrhh/empleados/" + empleadoId, HttpStatusCode.NoContent, EmpleadoDatos("Nombre actualizado"), "Edición laboral sin permiso salarial funciona");
        await Status(HttpMethod.Put, "/api/rrhh/cargos/" + cargoId, HttpStatusCode.Forbidden, new { id = cargoId, nombre = "Cargo nuevo", departamentoId, salarioReferencial = 8000, activo = true }, "Gestión de catálogos no concede modificación salarial");
        await Status(HttpMethod.Put, "/api/rrhh/cargos/" + cargoId, HttpStatusCode.NoContent, new { id = cargoId, nombre = "Cargo actualizado", departamentoId, activo = true }, "Editar catálogo conserva salario oculto");
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<RecursosHumanosDbContext>(); var emp = await db.Empleados.SingleAsync(e => e.Id == empleadoId);
            Check(emp.SalarioBase == 3000 && emp.CuentaBancaria == "123456" && emp.TieneAsignacionFamiliar, "Edición ordinaria conserva todos los datos confidenciales");
            Check((await db.Cargos.SingleAsync(c => c.Id == cargoId)).SalarioReferencial == 2500, "Edición de catálogo conserva salario referencial");
        }
        await Login("RrhhConfidencial");
        using (var r = await client.GetAsync("/api/rrhh/empleados/" + empleadoId)) Check((await Body(r)).GetProperty("salarioBase").GetDecimal() == 3000, "Rol personalizado con permiso confidencial ve salario");
        await Status(HttpMethod.Put, "/api/rrhh/empleados/" + empleadoId, HttpStatusCode.NoContent, EmpleadoDatos("Nombre autorizado", 4000, "456"), "Rol personalizado modifica datos confidenciales autorizado");

        const string gestion = "/api/gestion-datos";
        await Login("ImportadorSedes");
        using (var r = await client.GetAsync(gestion + "/entities")) { var list = await Body(r); Check(list.GetArrayLength() == 1 && list[0].GetProperty("entityName").GetString() == "UnidadOrganizativa", "Importador sólo recibe entidades gestionables"); }
        using (var r = await client.GetAsync(gestion + "/imports")) { var list = await Body(r); Check(list.EnumerateArray().All(x => x.GetProperty("creadoPorId").GetGuid() == ids["ImportadorSedes"] && x.GetProperty("tipoRegistro").GetString() == "UnidadOrganizativa"), "Historial sólo muestra autor y entidad autorizados"); }
        await Status(HttpMethod.Get, gestion + "/imports/" + propio, HttpStatusCode.OK, null, "Consulta importación propia");
        await Status(HttpMethod.Get, gestion + "/imports/" + ajeno, HttpStatusCode.NotFound, null, "Oculta importación ajena");
        await Status(HttpMethod.Get, gestion + "/imports/" + deOtraArea, HttpStatusCode.NotFound, null, "Ser propietario no abre entidad no autorizada");
        await Status(HttpMethod.Delete, gestion + "/imports/" + propio, HttpStatusCode.Forbidden, null, "Importar no concede eliminar historial");
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var gd = scope.ServiceProvider.GetRequiredService<GestionDatosDbContext>(); var count = await gd.DataImportJobs.CountAsync();
            using var deniedForm = new MultipartFormDataContent();
            deniedForm.Add(new StringContent("Usuario"), "entityName");
            deniedForm.Add(new ByteArrayContent(Encoding.UTF8.GetBytes("Email,NombreCompleto\nintruso@fixture.invalid,Intruso\n")), "file", "usuarios.csv");
            using var denied = await client.PostAsync(gestion + "/execute", deniedForm);
            Check(denied.StatusCode == HttpStatusCode.Forbidden && await gd.DataImportJobs.CountAsync() == count, "Entidad ajena rechazada antes de crear trabajo de importación");
        }
        using (var form = new MultipartFormDataContent())
        {
            form.Add(new StringContent("UnidadOrganizativa"), "entityName"); form.Add(new StringContent("Nombre falsificado"), "creadoPor");
            form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes("Codigo,Nombre\nALTA-IMPORT,Sede importada\n")), "file", "sedes.csv");
            using var r = await client.PostAsync(gestion + "/execute", form);
            Check(r.IsSuccessStatusCode, "Ejecuta CSV de sede: " + await r.Content.ReadAsStringAsync()); var job = await Body(r);
            Check(job.GetProperty("creadoPorId").GetGuid() == ids["ImportadorSedes"] && job.GetProperty("creadoPor").GetString() == "importadorsedes@fixture.invalid", "Autor procede del JWT y rechaza nombre enviado");
            Check(job.GetProperty("totalExitosos").GetInt32() == 1, "Importación crea la sede autorizada");
        }
        await Login("HistorialSedes");
        await Status(HttpMethod.Get, gestion + "/entities", HttpStatusCode.Forbidden, null, "Consultar historial no permite importar");
        await Status(HttpMethod.Delete, gestion + "/imports/" + ajeno, HttpStatusCode.Forbidden, null, "Consulta no permite eliminar");
        await Login("GestorHistorialSedes");
        await Status(HttpMethod.Get, gestion + "/imports/" + ajeno, HttpStatusCode.OK, null, "Permiso adicional permite historial del equipo");
        await Status(HttpMethod.Delete, gestion + "/imports/" + deOtraArea, HttpStatusCode.NotFound, null, "Eliminación respeta entidad autorizada");
        await Status(HttpMethod.Delete, gestion + "/imports/" + procesando, HttpStatusCode.Conflict, null, "No elimina procesos en curso");
        await Status(HttpMethod.Delete, gestion + "/imports/" + ajeno, HttpStatusCode.NoContent, null, "Eliminación autorizada de registro terminado");
        foreach (var prefix in new[] { "/api/data-management", "/api/servicio-campo/data-management" }) await Status(HttpMethod.Get, prefix + "/imports/" + deOtraArea, HttpStatusCode.NotFound, null, "Alias conserva autorización de entidad");
        await Login(Roles.InventarioAdmin);
        using (var form = new MultipartFormDataContent())
        {
            form.Add(new StringContent("InventarioInicial"), "entityName");
            form.Add(new StringContent(Guid.NewGuid().ToString()), "operacionId");
            form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes("Almacen,Producto,Cantidad\nALTA-B,ALTA-P,10\n")), "file", "existencias.csv");
            using var r = await client.PostAsync(gestion + "/execute", form);
            Check(r.IsSuccessStatusCode, "Importación registra resultado por fila: " + await r.Content.ReadAsStringAsync()); var job = await Body(r);
            Check(job.GetProperty("totalFallidos").GetInt32() == 1 && job.GetProperty("totalExitosos").GetInt32() == 0, "Administrador sin autorización de almacén no carga inventario inicial");
            await using var scope = app.Services.CreateAsyncScope();
            Check(!await scope.ServiceProvider.GetRequiredService<ServicioCampoDbContext>().StocksAlmacen.AnyAsync(s => s.UbicacionId == ubicacionB && s.ProductoId == productoId), "Fila de importación rechazada no modifica existencias");
        }
        Console.WriteLine($"Prioridades altas: {checks} comprobaciones de permisos, alcances, series, RRHH e importación CSV correctas (HTTP/JWT + InMemory).");
    }

    private sealed record TecnicoPrueba(Guid Id) : ICurrentUser
    {
        public string Email => "tecnico@fixture.invalid";
        public string Nombre => "Técnico de prueba";
        public IReadOnlyList<string> Roles => [];
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => false;
        public bool HasAnyRole(params string[] roles) => false;
        public bool HasPermission(string permission) => permission is Permissions.ServicioCampo.Acceso or Permissions.ServicioCampo.OrdenesVerAsignadas;
    }
}
