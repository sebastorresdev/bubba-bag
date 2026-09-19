using BubbaBag.Modules.Inventario.Application;
using BubbaBag.Modules.Inventario.Domain.Productos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Inventario.Infrastructure.Database;

public class InventarioDbContext : DbContext, IInventarioDbContext
{
    public InventarioDbContext(DbContextOptions<InventarioDbContext> options) : base(options)
    {
    }

    public DbSet<Producto> Productos => Set<Producto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("inventario");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(InventarioDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
