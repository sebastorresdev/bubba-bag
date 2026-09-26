using System.Reflection;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
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

    public DbSet<OrdenTrabajo> OrdenesTrabajo => Set<OrdenTrabajo>();
    public DbSet<OrdenTrabajoVisita> OrdenTrabajoVisitas => Set<OrdenTrabajoVisita>();
    public DbSet<OrdenTrabajoVisitaEvidencia> OrdenTrabajoVisitaEvidencias => Set<OrdenTrabajoVisitaEvidencia>();
    public DbSet<OrdenTrabajoTarea> OrdenTrabajoTareas => Set<OrdenTrabajoTarea>();
    public DbSet<OrdenTrabajoMaterial> OrdenTrabajoMateriales => Set<OrdenTrabajoMaterial>();
    public DbSet<ZonaOperativa> ZonasOperativas => Set<ZonaOperativa>();
    public DbSet<RecursoTecnico> RecursosTecnicos => Set<RecursoTecnico>();
    public DbSet<Almacen> Almacenes => Set<Almacen>();
    public DbSet<StockAlmacen> StocksAlmacen => Set<StockAlmacen>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<MotivoIncidencia> MotivosIncidencia => Set<MotivoIncidencia>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Ubigeo> Ubigeos => Set<Ubigeo>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<UnidadMedida> UnidadesMedida => Set<UnidadMedida>();
    public DbSet<CategoriaProducto> CategoriasProducto => Set<CategoriaProducto>();
    public DbSet<ListaPrecios> ListasPrecios => Set<ListaPrecios>();
    public DbSet<ElementoListaPrecios> ElementosListaPrecios => Set<ElementoListaPrecios>();
    public DbSet<ItemSeriado> ItemsSeriados => Set<ItemSeriado>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo => Set<TipoOrdenTrabajo>();
    public DbSet<CampoDefinicion> CamposDefinicion => Set<CampoDefinicion>();
    public DbSet<ProductoServicio> Servicios => Set<ProductoServicio>();
    public DbSet<TipoTareaServicio> TiposTareaServicio => Set<TipoTareaServicio>();

    // Plantillas y Catálogos de Tareas
    public DbSet<Tarea> Tareas => Set<Tarea>();
    public DbSet<PlantillaTrabajo> PlantillasTrabajo => Set<PlantillaTrabajo>();
    public DbSet<PlantillaTarea> PlantillasTareas => Set<PlantillaTarea>();
    public DbSet<PlantillaMaterial> PlantillasMateriales => Set<PlantillaMaterial>();

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

        // Referencia a la tabla maestra del módulo Recursos Humanos (externa)
        modelBuilder.Entity<Sucursal>(b =>
        {
            b.ToTable("Sucursales", "rrhh", t => t.ExcludeFromMigrations());
            b.HasKey(s => s.Id);
        });

        base.OnModelCreating(modelBuilder);
    }
}
