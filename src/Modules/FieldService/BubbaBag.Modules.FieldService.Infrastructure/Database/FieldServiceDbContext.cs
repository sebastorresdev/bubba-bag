using System.Reflection;
using BubbaBag.Modules.FieldService.Domain.Clientes;
using BubbaBag.Modules.FieldService.Domain.Mantenimientos;
using BubbaBag.Modules.FieldService.Domain.Tarifarios;
using BubbaBag.Modules.FieldService.Domain.WorkOrders;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database;

public class FieldServiceDbContext : DbContext
{
    public FieldServiceDbContext(DbContextOptions<FieldServiceDbContext> options) : base(options)
    {
    }

    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<WorkOrderTarea> WorkOrderTareas => Set<WorkOrderTarea>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo => Set<TipoOrdenTrabajo>();
    public DbSet<TipoTareaServicio> TiposTareaServicio => Set<TipoTareaServicio>();
    public DbSet<OrigenOrden> OrigenesOrden => Set<OrigenOrden>();
    public DbSet<Tarifario> Tarifarios => Set<Tarifario>();
    public DbSet<TarifarioRegla> TarifarioReglas => Set<TarifarioRegla>();
    public DbSet<TarifarioReglaCriterio> TarifarioReglaCriterios => Set<TarifarioReglaCriterio>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("fieldservice");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
