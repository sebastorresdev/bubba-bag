using System.Reflection;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database;

public class ServicioCampoDbContext : DbContext
{
    public ServicioCampoDbContext(DbContextOptions<ServicioCampoDbContext> options) : base(options)
    {
    }

    public DbSet<OrdenTrabajo> OrdenesTrabajo => Set<OrdenTrabajo>();
    public DbSet<OrdenTrabajoTarea> OrdenTrabajoTareas => Set<OrdenTrabajoTarea>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo => Set<TipoOrdenTrabajo>();
    public DbSet<TipoTareaServicio> TiposTareaServicio => Set<TipoTareaServicio>();
    public DbSet<OrigenOrden> OrigenesOrden => Set<OrigenOrden>();
    public DbSet<Tarifario> Tarifarios => Set<Tarifario>();
    public DbSet<TarifarioRegla> TarifarioReglas => Set<TarifarioRegla>();
    public DbSet<TarifarioReglaCriterio> TarifarioReglaCriterios => Set<TarifarioReglaCriterio>();

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

        base.OnModelCreating(modelBuilder);
    }
}
