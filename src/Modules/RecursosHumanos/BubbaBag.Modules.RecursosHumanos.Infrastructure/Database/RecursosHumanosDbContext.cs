using System.Reflection;
using BubbaBag.Modules.RecursosHumanos.Application;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;

public class RecursosHumanosDbContext : DbContext, IRecursosHumanosDbContext
{
    public RecursosHumanosDbContext(DbContextOptions<RecursosHumanosDbContext> options) : base(options)
    {
    }

    public DbSet<Empleado> Empleados => Set<Empleado>();
    public DbSet<Departamento> Departamentos => Set<Departamento>();
    public DbSet<Cargo> Cargos => Set<Cargo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("rrhh");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
