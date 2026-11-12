using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Consolidado;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Marcaciones;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Empleados;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application;

public interface IRecursosHumanosDbContext
{
    DbSet<Empleado> Empleados { get; }
    DbSet<Departamento> Departamentos { get; }
    DbSet<Cargo> Cargos { get; }
    DbSet<Sucursal> Sucursales { get; }
    DbSet<Turno> Turnos { get; }
    DbSet<PlantillaSemanalFija> PlantillasSemanales { get; }
    DbSet<MarcacionCruda> Marcaciones { get; }
    DbSet<AsistenciaDiaria> AsistenciasDiarias { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
