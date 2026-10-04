using System.Reflection;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using BubbaBag.Modules.ServicioCampo.Domain.Ubigeos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database;

public class ServicioCampoDbContext : DbContext, IServicioCampoDbContext
{
    public ServicioCampoDbContext(DbContextOptions<ServicioCampoDbContext> options) : base(options)
    {
    }

    public DbSet<UnidadOrganizativa> UnidadesOrganizativas => Set<UnidadOrganizativa>();
    public DbSet<OrdenTrabajo> OrdenesTrabajo => Set<OrdenTrabajo>();
    public DbSet<OrdenTrabajoVisita> OrdenTrabajoVisitas => Set<OrdenTrabajoVisita>();
    public DbSet<OrdenTrabajoVisitaEvidencia> OrdenTrabajoVisitaEvidencias => Set<OrdenTrabajoVisitaEvidencia>();
    public DbSet<OrdenTrabajoTarea> OrdenTrabajoTareas => Set<OrdenTrabajoTarea>();
    public DbSet<OrdenTrabajoMaterial> OrdenTrabajoMateriales => Set<OrdenTrabajoMaterial>();
    public DbSet<ZonaOperativa> ZonasOperativas => Set<ZonaOperativa>();
    public DbSet<Recurso> Recursos => Set<Recurso>();
    public DbSet<UbicacionInventario> UbicacionesInventario => Set<UbicacionInventario>();
    public DbSet<Almacen> Almacenes => Set<Almacen>();
    public DbSet<UsuarioAlmacenAutorizacion> UsuarioAlmacenAutorizaciones => Set<UsuarioAlmacenAutorizacion>();
    public DbSet<Transferencia> Transferencias => Set<Transferencia>();
    public DbSet<TransferenciaDetalle> TransferenciaDetalles => Set<TransferenciaDetalle>();
    public DbSet<TransferenciaDetalleSerie> TransferenciaDetalleSeries => Set<TransferenciaDetalleSerie>();
    public DbSet<RecepcionTransferencia> RecepcionesTransferencia => Set<RecepcionTransferencia>();
    public DbSet<RecepcionTransferenciaDetalle> RecepcionTransferenciaDetalles => Set<RecepcionTransferenciaDetalle>();
    public DbSet<ResolucionDiferenciaTransferencia> ResolucionDiferenciaTransferencias => Set<ResolucionDiferenciaTransferencia>();
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<StockAlmacen> StocksAlmacen => Set<StockAlmacen>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<MotivoIncidencia> MotivosIncidencia => Set<MotivoIncidencia>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Ubigeo> Ubigeos => Set<Ubigeo>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<UnidadMedida> UnidadesMedida => Set<UnidadMedida>();
    public DbSet<GrupoUnidadMedida> GruposUnidadMedida => Set<GrupoUnidadMedida>();
    public DbSet<CategoriaProducto> CategoriasProducto => Set<CategoriaProducto>();
    public DbSet<ListaPrecios> ListasPrecios => Set<ListaPrecios>();
    public DbSet<ElementoListaPrecios> ElementosListaPrecios => Set<ElementoListaPrecios>();
    public DbSet<ItemSeriado> ItemsSeriados => Set<ItemSeriado>();
    public DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo => Set<TipoOrdenTrabajo>();
    public DbSet<CampoDefinicion> CamposDefinicion => Set<CampoDefinicion>();
    public DbSet<TipoTareaServicio> TiposTareaServicio => Set<TipoTareaServicio>();

    // Plantillas y Catálogos de Tareas
    public DbSet<Tarea> Tareas => Set<Tarea>();
    public DbSet<PlantillaTrabajo> PlantillasTrabajo => Set<PlantillaTrabajo>();
    public DbSet<PlantillaTarea> PlantillasTareas => Set<PlantillaTarea>();
    public DbSet<PlantillaMaterial> PlantillasMateriales => Set<PlantillaMaterial>();

    public async Task EjecutarEnTransaccionAsync(
        Func<CancellationToken, Task> operacion,
        CancellationToken cancellationToken = default)
    {
        var estrategia = Database.CreateExecutionStrategy();
        await estrategia.ExecuteAsync(async () =>
        {
            await using var transaccion = await Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await operacion(cancellationToken);
                await transaccion.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaccion.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    // Ejecución de Trabajos y Liquidación de Materiales
    public DbSet<Trabajo> Trabajos => Set<Trabajo>();
    public DbSet<TareaTrabajo> TareasTrabajo => Set<TareaTrabajo>();
    public DbSet<MaterialTrabajo> MaterialesTrabajo => Set<MaterialTrabajo>();
    public DbSet<LiquidacionMaterial> LiquidacionesMaterial => Set<LiquidacionMaterial>();
    public DbSet<LiquidacionMaterialItem> LiquidacionesMaterialItems => Set<LiquidacionMaterialItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("serviciocampo");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(modelBuilder);
    }
}
