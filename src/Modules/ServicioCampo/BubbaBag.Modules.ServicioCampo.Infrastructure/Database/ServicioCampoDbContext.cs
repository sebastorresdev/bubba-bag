using System.Reflection;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.Modules.Inventario.Domain.Productos;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using BubbaBag.Modules.ServicioCampo.Application;
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
    public DbSet<MotivoIncidencia> MotivosIncidencia => Set<MotivoIncidencia>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo => Set<TipoOrdenTrabajo>();
    public DbSet<CampoDefinicion> CamposDefinicion => Set<CampoDefinicion>();
    public DbSet<CatalogoServicio> CatalogosServicio => Set<CatalogoServicio>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<ServicioPaso> ServicioPasos => Set<ServicioPaso>();
    public DbSet<ServicioMaterial> ServicioMateriales => Set<ServicioMaterial>();
    public DbSet<SucursalServicio> SucursalesServicio => Set<SucursalServicio>();
    public DbSet<TipoTareaServicio> TiposTareaServicio => Set<TipoTareaServicio>();
    public DbSet<Tarifario> Tarifarios => Set<Tarifario>();
    public DbSet<TarifarioRegla> TarifarioReglas => Set<TarifarioRegla>();
    public DbSet<TarifaServicio> TarifasServicio => Set<TarifaServicio>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("serviciocampo");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Referencia a la tabla maestra del módulo CRM
        modelBuilder.Entity<Cliente>(b =>
        {
            b.ToTable("clientes", "crm", t => t.ExcludeFromMigrations());
            b.HasKey(c => c.Id);
            b.Ignore(c => c.Ubigeo);
        });

        // Referencia a la tabla maestra del módulo Inventario
        modelBuilder.Entity<Producto>(b =>
        {
            b.ToTable("Productos", "inventario", t => t.ExcludeFromMigrations());
            b.HasKey(p => p.Id);
        });

        // Referencia a la tabla maestra del módulo Recursos Humanos
        modelBuilder.Entity<Sucursal>(b =>
        {
            b.ToTable("Sucursales", "rrhh", t => t.ExcludeFromMigrations());
            b.HasKey(s => s.Id);
        });

        base.OnModelCreating(modelBuilder);
    }
}
