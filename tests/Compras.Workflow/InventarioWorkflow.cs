using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearTransferenciaInventario;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.RecepcionarTransferencia;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ResolverDiferenciaTransferencia;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerInventarioProductos;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerSeriesStock;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciaDetalle;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using BubbaBag.SharedKernel;
using Microsoft.EntityFrameworkCore;

internal static class InventarioWorkflow
{
    public static async Task RunAsync(string? conexion = null)
    {
        var options = new DbContextOptionsBuilder<ServicioCampoDbContext>();
        if (conexion == null) options.UseInMemoryDatabase(Guid.NewGuid().ToString());
        else options.UseNpgsql(conexion);
        await using ServicioCampoDbContext db = conexion == null ? new TestContext(options.Options) : new ServicioCampoDbContext(options.Options);
        if (conexion != null) await db.Database.EnsureCreatedAsync();
        IServicioCampoDbContext context = db;
        var origenUser = new Operador(); var destinoUser = new Operador(); var tecnicoUser = new Operador(); var supervisor = new Operador();
        var tru = UnidadOrganizativa.Crear("TRU", "Trujillo"); var chi = UnidadOrganizativa.Crear("CHI", "Chiclayo");
        var a = Almacen.CrearBodega("TRU", "Bodega Trujillo", tru.Id);
        var b = Almacen.CrearBodega("CHI", "Bodega Chiclayo", chi.Id);
        // Custody resource FK requires an actual resource in relational tests.
        var recurso = BubbaBag.Modules.ServicioCampo.Domain.Recursos.Recurso.Crear("ANA", "Ana");
        var personal = Almacen.CrearCustodiaPersonal("CUS", "Custodia Ana", tru.Id, recurso.Id);
        recurso.AsignarUnidadOrganizativa(tru.Id);
        var ua = UbicacionInventario.Crear(a.Id,"PRINCIPAL","Principal",true);
        var ub = UbicacionInventario.Crear(b.Id,"PRINCIPAL","Principal",true);
        var up = UbicacionInventario.Crear(personal.Id,"PRINCIPAL","Principal",true);
        var estante = UbicacionInventario.Crear(a.Id,"E1","Estante 1");
        var (grupo, unidad) = GrupoUnidadMedida.Crear("Unidades logísticas", "Unidad");
        var p = Producto.Crear("CABLE", "Cable", grupoUnidadMedidaId:grupo.Id,unidadMedidaDefectoId:unidad.Id,decimalesCantidad:5);
        var equipo = Producto.Crear("EQUIPO", "Equipo", grupoUnidadMedidaId:grupo.Id,unidadMedidaDefectoId:unidad.Id,esSerializado:true);
        var agotado = Producto.Crear("AGOTADO", "Agotado", grupoUnidadMedidaId:grupo.Id,unidadMedidaDefectoId:unidad.Id);
        db.UnidadesOrganizativas.AddRange(tru,chi); db.Recursos.Add(recurso); db.Almacenes.AddRange(a,b,personal);
        db.UbicacionesInventario.AddRange(ua,ub,up,estante); db.GruposUnidadMedida.Add(grupo); db.UnidadesMedida.Add(unidad); db.Productos.AddRange(p,equipo,agotado);
        db.StocksAlmacen.AddRange(StockAlmacen.Crear(ua.Id,p.Id,100),StockAlmacen.Crear(ua.Id,equipo.Id,3));
        var s1 = ItemSeriado.Crear(equipo.Id,"S1",ua.Id); var s2 = ItemSeriado.Crear(equipo.Id,"S2",ua.Id); var s3 = ItemSeriado.Crear(equipo.Id,"S3",ua.Id);
        db.ItemsSeriados.AddRange(s1,s2,s3);
        db.UsuarioAlmacenAutorizaciones.AddRange(
            UsuarioAlmacenAutorizacion.Crear(origenUser.Id,a.Id), UsuarioAlmacenAutorizacion.Crear(origenUser.Id,personal.Id),
            UsuarioAlmacenAutorizacion.Crear(destinoUser.Id,b.Id),
            UsuarioAlmacenAutorizacion.Crear(supervisor.Id,a.Id,esSupervisor:true), UsuarioAlmacenAutorizacion.Crear(supervisor.Id,b.Id,esSupervisor:true));
        await db.SaveChangesAsync();
        var despacho = new CrearTransferenciaInventarioHandler(context,origenUser);
        CrearTransferenciaInventarioCommand Envio(Almacen origen,Almacen destino,UbicacionInventario uo,UbicacionInventario ud,decimal cantidad,IReadOnlyCollection<string>? series=null,Guid producto=default,ModalidadTransferencia? modalidad=null) => new(origen.Id,destino.Id,[new(producto==Guid.Empty?p.Id:producto,cantidad,series)],UbicacionOrigenId:uo.Id,UbicacionDestinoId:ud.Id,Modalidad:modalidad,OperacionId:Guid.NewGuid());
        var abastecer = Envio(a,personal,ua,up,10);
        Check((await despacho.HandleAsync(abastecer)).IsSuccess,"Abastecimiento local por almacenero autorizado");
        Check((await db.StocksAlmacen.SingleAsync(x=>x.UbicacionId==up.Id && x.ProductoId==p.Id)).CantidadDisponible==10,"Stock en custodia personal");
        Check((await despacho.HandleAsync(abastecer)).IsSuccess && await db.Transferencias.CountAsync()==1,"Reintento no duplica despacho");
        Check((await despacho.HandleAsync(abastecer with{Lineas=[new(p.Id,11)]})).IsFailure,"No reutilizar operación para otro envío");
        Check((await new CrearTransferenciaInventarioHandler(context,tecnicoUser).HandleAsync(Envio(personal,a,up,ua,1))).IsFailure,"Técnico sin autorización no realiza devolución");
        Check((await despacho.HandleAsync(Envio(personal,a,up,ua,2))).IsSuccess,"Almacenero realiza devolución a bodega de su unidad");
        Check((await despacho.HandleAsync(Envio(b,personal,ub,up,1))).IsFailure,"Origen sin autorización bloqueado");
        Check((await new CrearTransferenciaInventarioHandler(context,destinoUser).HandleAsync(Envio(b,personal,ub,up,1))).IsFailure,"No abastecer custodia de otra unidad");
        Check((await despacho.HandleAsync(Envio(a,b,ua,ub,1,modalidad:ModalidadTransferencia.Inmediata))).IsFailure,"Otra unidad exige recepción separada");
        Check((await despacho.HandleAsync(Envio(a,b,ub,ua,1))).IsFailure,"No sustituir ubicaciones de los almacenes");
        Check((await despacho.HandleAsync(Envio(a,a,ua,estante,0.12345m))).IsSuccess,"Reubicación interna conserva cinco decimales");
        var enviarSeries = Envio(a,b,ua,ub,3,["S1","S2","S3"],equipo.Id);
        var enviado = await despacho.HandleAsync(enviarSeries);
        Check(enviado.IsSuccess,"Despacho de series a tránsito");
        var t = await db.Transferencias.Include(x=>x.Lineas).ThenInclude(x=>x.Series).SingleAsync(x=>x.Numero==enviado.Value);
        var linea = t.Lineas.Single();
        Check(t.Estado==EstadoTransferencia.EnTransito && s1.UbicacionActualId==null && s1.TransferenciaEnTransitoId==t.Id,"Tránsito identifica documento y no una custodia disponible");
        Check((await db.StocksAlmacen.SingleAsync(x=>x.ProductoId==equipo.Id && x.UbicacionId==ua.Id)).CantidadDisponible==0,"Despacho descuenta solo origen");
        Check(!await db.StocksAlmacen.AnyAsync(x=>x.ProductoId==equipo.Id && x.UbicacionId==ub.Id),"Destino no aumenta antes de recibir");
        var seriesDisponibles=await new ObtenerSeriesStockHandler(context,origenUser).HandleAsync(new ObtenerSeriesStockQuery());
        Check(seriesDisponibles.Value.Count==0,"Selector de stock excluye las series en tránsito");
        var seriesTrazables=await new ObtenerSeriesStockHandler(context,destinoUser).HandleAsync(new ObtenerSeriesStockQuery(IncluirTransito:true));
        Check(seriesTrazables.Value.Count==3 && seriesTrazables.Value.All(s=>s.TransferenciaEnTransitoId==t.Id),"Destino puede trazar su envío sin habilitar su stock");
        Check((await new ObtenerSeriesStockHandler(context,tecnicoUser).HandleAsync(new ObtenerSeriesStockQuery(IncluirTransito:true))).Value.Count==0,"Tránsito tampoco revela series fuera del alcance");
        Check((await despacho.HandleAsync(Envio(a,personal,ua,up,1,["S2"],equipo.Id))).IsFailure,"Serie en tránsito no se puede despachar");
        var recibir = new RecepcionarTransferenciaHandler(context,destinoUser);
        var recepcion = new RecepcionarTransferenciaCommand(t.Id,[new(linea.Id,1,["S2"])],OperacionId:Guid.NewGuid());
        Check((await new RecepcionarTransferenciaHandler(context,origenUser).HandleAsync(recepcion)).IsFailure,"Origen no puede recibir por destino");
        Check((await recibir.HandleAsync(recepcion with{Lineas=[new(linea.Id,1,[])]})).IsFailure,"Cantidad sola no recibe serie arbitraria");
        Check((await recibir.HandleAsync(recepcion)).IsSuccess,"Recepción captura serie realmente recibida");
        Check(s2.UbicacionActualId==ub.Id && s1.TransferenciaEnTransitoId==t.Id && s3.TransferenciaEnTransitoId==t.Id,"Se recibe S2, S1 y S3 siguen pendientes");
        Check(linea.CantidadPendiente==2 && t.Estado==EstadoTransferencia.ParcialmenteRecibida,"Recepción parcial conserva saldo");
        Check((await recibir.HandleAsync(recepcion)).IsSuccess && await db.RecepcionesTransferencia.CountAsync()==1,"Reintento de recepción no duplica stock");
        Check((await recibir.HandleAsync(recepcion with{OperacionId=Guid.NewGuid()})).IsFailure,"Serie recibida no se recibe otra vez");
        var resolver = new ResolverDiferenciaTransferenciaHandler(context,supervisor);
        var restitucion = new ResolverDiferenciaTransferenciaCommand(t.Id,linea.Id,1,TipoResolucionDiferencia.RestitucionAOrigen,"Encontrado en origen","ACTA-1",["S1"],Guid.NewGuid());
        Check((await new ResolverDiferenciaTransferenciaHandler(context,destinoUser).HandleAsync(restitucion)).IsFailure,"Almacenero no sustituye al supervisor");
        Check((await resolver.HandleAsync(restitucion)).IsSuccess && s1.UbicacionActualId==ua.Id && linea.CantidadPendiente==1,"Supervisor restituye solo serie verificada en origen");
        Check((await resolver.HandleAsync(restitucion)).IsSuccess,"Resolución idempotente");
        Check((await resolver.HandleAsync(restitucion with{Series=["S3"]})).IsFailure,"Operación de resolución no sustituye series");
        Check((await resolver.HandleAsync(restitucion with{OperacionId=Guid.NewGuid(),Resultado=TipoResolucionDiferencia.RecepcionComplementariaDestino,Series=["S3"]})).IsSuccess,"Supervisor incorpora serie comprobada en destino");
        Check(t.Estado==EstadoTransferencia.Cerrada && linea.CantidadPendiente==0 && s3.UbicacionActualId==ub.Id,"Cierre conserva stock y serie exacta");
        Check(await db.StocksAlmacen.Where(x=>x.ProductoId==equipo.Id).SumAsync(x=>x.CantidadDisponible)==3,"No se crean ni desaparecen series al resolver");
        var historial=await new ObtenerTransferenciaDetalleHandler(context,destinoUser).HandleAsync(new(t.Id));
        Check(historial.IsSuccess && historial.Value.Recepciones.Single().Lineas.Single().Series.SequenceEqual(["S2"]) && historial.Value.Resoluciones.Count==2,"Historial conserva captura exacta y evidencia de resoluciones");
        Check(historial.Value.Lineas.Single().UnidadMedidaNombre==unidad.Nombre && historial.Value.UbicacionDestinoNombre==ub.Nombre,"Documento conserva unidad y ubicaciones");
        Check((await new ObtenerTransferenciaDetalleHandler(context,tecnicoUser).HandleAsync(new(t.Id))).IsFailure,"Sin alcance tampoco se abre el historial");
        var consulta = await new ObtenerInventarioProductosHandler(context,tecnicoUser).HandleAsync(new ObtenerInventarioProductosQuery());
        Check(consulta.IsSuccess && consulta.Value.Count==0,"Consulta sin permiso no filtra existencias de otras sedes");
        Check(await InventarioAcceso.PuedeAsync(context,origenUser,personal.Id,"despachar",default) && !await InventarioAcceso.PuedeAsync(context,tecnicoUser,personal.Id,"despachar",default),"Responsabilidad y autorización son independientes");
        // On PostgreSQL verify transaction rollback, unique indexes and optimistic concurrency.
        if(conexion!=null)
        {
            var anteriorStock=(await db.StocksAlmacen.SingleAsync(x=>x.UbicacionId==ua.Id && x.ProductoId==p.Id)).CantidadDisponible;
            var documentos=await db.Transferencias.CountAsync();
            Check((await despacho.HandleAsync(new(a.Id,personal.Id,[new(p.Id,1),new(agotado.Id,1)],UbicacionOrigenId:ua.Id,UbicacionDestinoId:up.Id,OperacionId:Guid.NewGuid()))).IsFailure,"Fallo en segunda línea revierte descuento de la primera");
            db.ChangeTracker.Clear();
            Check((await db.StocksAlmacen.SingleAsync(x=>x.UbicacionId==ua.Id && x.ProductoId==p.Id)).CantidadDisponible==anteriorStock,"Transacción revierte el primer saldo y los movimientos");
            Check(!await db.StocksAlmacen.AnyAsync(x=>x.ProductoId==agotado.Id),"Transacción elimina el saldo provisional del producto agotado");
            Check(await db.Transferencias.CountAsync()==documentos,"Envío rechazado no crea documento");
            await using var otra = new ServicioCampoDbContext(options.Options);
            var viejo=await otra.StocksAlmacen.SingleAsync(x=>x.UbicacionId==ua.Id && x.ProductoId==p.Id);
            Check((await despacho.HandleAsync(Envio(a,personal,ua,up,1))).IsSuccess,"Movimiento concurrente válido");
            viejo.DisminuirStock(1);
            var conflicto=false;try{await otra.SaveChangesAsync();}catch(DbUpdateConcurrencyException){conflicto=true;}
            Check(conflicto,"xmin evita sobrescribir un saldo modificado por otro operador");
            db.ChangeTracker.Clear();
            // First line can deduct, second has insufficient non-serial stock: transaction must restore the first.
            Check((await despacho.HandleAsync(Envio(a,personal,ua,up,999999))).IsFailure,"No se admite stock negativo");
            db.ChangeTracker.Clear();
            Check((await db.StocksAlmacen.SingleAsync(x=>x.UbicacionId==ua.Id && x.ProductoId==p.Id)).CantidadDisponible==anteriorStock-1,"Rechazo conserva el saldo persistido");
        }
        Console.WriteLine($"Inventario: reglas territoriales, custodia, ubicación, tránsito, series, permisos y reintentos correctos ({(conexion==null?"InMemory":"PostgreSQL")}).");
    }
    private static void Check(bool condition,string message){if(!condition)throw new Exception(message);}
    private sealed class Operador : ICurrentUser
    {
        public Guid Id {get;}=Guid.NewGuid(); public string Nombre=>"Almacenero de prueba"; public string Email=>"almacenero@example.test";
        public IReadOnlyList<string> Roles=>[]; public bool IsAuthenticated=>true;
        public bool IsInRole(string role)=>false; public bool HasAnyRole(params string[] roles)=>false; public bool HasPermission(string permission)=>false;
    }
}
