using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Compras;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerProductos;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using BubbaBag.SharedKernel;
using Microsoft.EntityFrameworkCore;

await using var db = new TestContext(new DbContextOptionsBuilder<ServicioCampoDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
var user = new TestUser();
var handler = new CrearCompraHandler(db, user);
var datos = new CrearCompraCommand("", "Factura", "", new DateOnly(2026, 9, 30), "PEN", null, [], null);
var creado = await handler.HandleAsync(datos);
Check(creado.IsSuccess, "Se puede guardar un borrador sin productos ni comprobante");
var compra = await db.Compras.SingleAsync();
var codigo = compra.Numero;
Check(codigo == "CMP-000001" && compra.Estado == "Borrador", "El primer guardado asigna código correlativo y estado");
Check(!await db.StocksAlmacen.AnyAsync() && !await db.MovimientosInventario.AnyAsync(), "Guardar no altera inventario");
Check((await handler.ProcesarAsync(compra.Id, true, default)).IsFailure, "No se puede recepcionar un borrador");
Check((await handler.ProcesarAsync(compra.Id, false, default)).IsFailure, "No se puede solicitar un borrador incompleto");
var almacen = Almacen.Crear("Almacén de prueba", null, user.Id, user.Nombre);
var (grupo, unidad) = GrupoUnidadMedida.Crear("Unidades de prueba", "Unidad");
var producto = Producto.Crear("PRUEBA", "Producto", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id);
var equipo = Producto.Crear("SERIE", "Equipo", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id, esSerializado: true);
db.Almacenes.Add(almacen); db.UbicacionesInventario.Add(UbicacionInventario.Crear(almacen.Id,"PRINCIPAL","Principal",true)); db.GruposUnidadMedida.Add(grupo); db.UnidadesMedida.Add(unidad); db.Productos.AddRange(producto, equipo);
await db.SaveChangesAsync();
var buscador = new ObtenerProductosHandler(db);
Check((await buscador.HandleAsync(new ObtenerProductosQuery(Search: "prueba", Tipo: TipoProducto.Inventario, Limite: 20))).Value.Single().Id == producto.Id, "La búsqueda consulta productos nuevos por código");
Check((await buscador.HandleAsync(new ObtenerProductosQuery(Search: "equipo", Tipo: TipoProducto.Inventario, Limite: 20))).Value.Single().Id == equipo.Id, "La búsqueda consulta por nombre");
Check((await buscador.HandleAsync(new ObtenerProductosQuery(Tipo: TipoProducto.Inventario, Limite: 1))).Value.Count == 1, "La búsqueda limita resultados en la consulta");
datos = datos with { Proveedor = "Proveedor", AlmacenId = almacen.Id, Lineas = [new(producto.Id, 3, 10.50m, []), new(equipo.Id, 2, 20, [])] };
Check((await handler.GuardarAsync(datos, compra.Id, default)).IsSuccess, "Se reabre y completa el borrador");
Check(compra.Numero == codigo, "Las ediciones conservan el código");
Check((await handler.ProcesarAsync(compra.Id, false, default)).IsSuccess && compra.Estado == "Solicitada", "La solicitud cambia el estado sin exigir comprobante ni series");
Check(!await db.StocksAlmacen.AnyAsync(), "Solicitar no aumenta stock");
Check((await handler.GuardarAsync(datos with { Lineas = [new(producto.Id, 99, 10.50m, [])] }, compra.Id, default)).IsFailure, "No se pueden cambiar las cantidades solicitadas");
Check((await handler.ProcesarAsync(compra.Id, true, default)).IsFailure, "No se puede recepcionar una compra sin enviar");
Check((await handler.ProcesarAsync(compra.Id, false, default, enviar: true)).IsFailure, "El envío exige series completas");
datos = datos with { NumeroDocumento = "F001-1" };
Check((await handler.GuardarAsync(datos, compra.Id, default)).IsSuccess, "El comprobante se puede completar después de solicitar");
Check((await handler.ProcesarAsync(compra.Id, false, default, enviar: true)).IsFailure, "No se puede enviar un producto serializado sin sus series");
datos = datos with { NumeroDocumento = "F001-1", Lineas = [new(producto.Id, 3, 10.50m, []), new(equipo.Id, 2, 20, ["EQ-1", "EQ-2"])] };
Check((await handler.GuardarAsync(datos, compra.Id, default)).IsSuccess, "Se completa comprobante y series de la solicitud");
datos = datos with { NumeroDocumento = "" };
Check((await handler.GuardarAsync(datos, compra.Id, default)).IsSuccess, "El envío puede prepararse sin comprobante");
Check((await handler.ProcesarAsync(compra.Id, false, default, enviar: true)).IsSuccess && compra.Estado == "Enviada", "Registrar envío cambia el estado a Enviada sin exigir comprobante");
Check((await handler.ProcesarAsync(compra.Id, true, default)).IsFailure, "La recepción exige el comprobante");
datos = datos with { NumeroDocumento = "F001-1" };
Check((await handler.GuardarAsync(datos, compra.Id, default)).IsFailure, "La ficha enviada bloquea también el comprobante");
Check(!await db.StocksAlmacen.AnyAsync() && !await db.ItemsSeriados.AnyAsync(), "El envío no altera inventario ni registra equipos recibidos");
Check((await handler.ProcesarAsync(compra.Id, false, default, enviar: true)).IsFailure, "No se puede enviar dos veces");
Check((await handler.GuardarAsync(datos with { Lineas = [new(producto.Id, 3, 10.50m, []), new(equipo.Id, 2, 20, ["EQ-3", "EQ-4"])] }, compra.Id, default)).IsFailure, "El envío confirmado no admite modificar series");
Check((await handler.GuardarAsync(datos with { TipoDocumento = "Boleta" }, compra.Id, default)).IsFailure, "La ficha enviada bloquea el tipo de comprobante");
Check((await handler.GuardarAsync(datos with { Observacion = "Cambiar" }, compra.Id, default)).IsFailure, "La ficha enviada bloquea la observación");
Check((await handler.ProcesarAsync(compra.Id, true, default, recepcion: new("Factura", "", datos.FechaDocumento))).IsFailure && compra.NumeroDocumento == "" && !await db.StocksAlmacen.AnyAsync(), "Una recepción sin comprobante no altera la compra ni el stock");
Check((await handler.ProcesarAsync(compra.Id, true, default, recepcion: new("Factura", "F001-1", datos.FechaDocumento))).IsSuccess && compra.Estado == "Recibida" && compra.NumeroDocumento == "F001-1", "Confirmar recepción registra comprobante y cambia estado juntos");
Check(await db.StocksAlmacen.SumAsync(x => x.CantidadDisponible) == 5 && await db.ItemsSeriados.CountAsync() == 2 && await db.MovimientosInventario.CountAsync() == 3, "La recepción registra stock, series y movimientos");
Check((await handler.ProcesarAsync(compra.Id, true, default)).IsFailure && await db.StocksAlmacen.SumAsync(x => x.CantidadDisponible) == 5, "No se puede recepcionar dos veces");
Check((await handler.GuardarAsync(datos, compra.Id, default)).IsFailure, "La compra recibida no admite edición");
Check(compra.Numero == codigo && compra.Total == 71.50m, "Código e importe permanecen correctos");
var conComprobante = datos with { NumeroDocumento = "F001-2", Lineas = [new(producto.Id, 1, 10.50m, [])] };
var segunda = await handler.HandleAsync(conComprobante);
Check(segunda.IsSuccess, "Se crea una compra con comprobante registrado");
Check((await handler.ProcesarAsync(segunda.Value, false, default)).IsSuccess && (await handler.ProcesarAsync(segunda.Value, false, default, enviar: true)).IsSuccess, "La compra con comprobante avanza hasta enviada");
Check((await handler.ProcesarAsync(segunda.Value, true, default, recepcion: new("Boleta", "OTRO", datos.FechaDocumento))).IsFailure, "La recepción no permite cambiar un comprobante existente");
var original = await db.Compras.FindAsync(segunda.Value);
Check(original!.Estado == "Enviada" && original.NumeroDocumento == "F001-2" && await db.StocksAlmacen.SumAsync(x => x.CantidadDisponible) == 5, "El intento de cambiar comprobante conserva estado, documento y stock");
Check((await handler.ProcesarAsync(segunda.Value, true, default, recepcion: new("Factura", "F001-2", datos.FechaDocumento))).IsSuccess, "La recepción conserva el comprobante original");
Console.WriteLine("38 comprobaciones de compras y búsqueda correctas.");
await InventarioWorkflow.RunAsync();
var conexionInventario = Environment.GetEnvironmentVariable("INVENTARIO_TEST_CONNECTION");
if (!string.IsNullOrWhiteSpace(conexionInventario)) await InventarioWorkflow.RunAsync(conexionInventario);

static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
sealed class TestContext(DbContextOptions<ServicioCampoDbContext> options) : ServicioCampoDbContext(options), IServicioCampoDbContext
{
    // InMemory verifies workflow effects; PostgreSQL transactions and unique indexes require a relational test.
    public new Task EjecutarEnTransaccionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
}
sealed class TestUser : ICurrentUser
{
    public Guid Id { get; } = Guid.NewGuid(); public string Nombre => "Prueba"; public string Email => "prueba@example.test";
    public IReadOnlyList<string> Roles => []; public bool IsAuthenticated => true;
    public bool IsInRole(string role) => true; public bool HasAnyRole(params string[] roles) => true; public bool HasPermission(string permission) => true;
}
