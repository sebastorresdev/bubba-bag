using BubbaBag.Modules.Ventas.Application;
using BubbaBag.Modules.Ventas.Domain.ListasPrecio;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Ventas.Infrastructure.Database;

public class VentasDbContext : DbContext, IVentasDbContext
{
    public VentasDbContext(DbContextOptions<VentasDbContext> options) : base(options) { }

    public DbSet<ListaPrecio> ListasPrecio => Set<ListaPrecio>();
    public DbSet<ListaPrecioItem> ListasPrecioItems => Set<ListaPrecioItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("ventas");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(VentasDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
