using BubbaBag.Modules.RecursosHumanos.Application;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;

public class RecursosHumanosDbContext : DbContext, IRecursosHumanosDbContext
{
    public RecursosHumanosDbContext(DbContextOptions<RecursosHumanosDbContext> options) : base(options)
    {
    }

    public DbSet<Empleado> Empleados => Set<Empleado>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("rrhh");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
