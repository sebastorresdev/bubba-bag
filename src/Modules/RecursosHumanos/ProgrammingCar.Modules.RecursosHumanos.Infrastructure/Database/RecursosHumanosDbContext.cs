using System.Reflection;
using ProgrammingCar.Modules.RecursosHumanos.Application;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Consolidado;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Marcaciones;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Empleados;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database;

public class RecursosHumanosDbContext : DbContext, IRecursosHumanosDbContext
{
    public RecursosHumanosDbContext(DbContextOptions<RecursosHumanosDbContext> options) : base(options)
    {
    }

    public DbSet<Empleado> Empleados => Set<Empleado>();
    public DbSet<Departamento> Departamentos => Set<Departamento>();
    public DbSet<Cargo> Cargos => Set<Cargo>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Turno> Turnos => Set<Turno>();
    public DbSet<PlantillaSemanalFija> PlantillasSemanales => Set<PlantillaSemanalFija>();
    public DbSet<MarcacionCruda> Marcaciones => Set<MarcacionCruda>();
    public DbSet<AsistenciaDiaria> AsistenciasDiarias => Set<AsistenciaDiaria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("rrhh");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
