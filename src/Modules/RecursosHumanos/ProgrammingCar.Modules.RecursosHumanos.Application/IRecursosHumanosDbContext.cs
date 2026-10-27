using System.Threading;
using System.Threading.Tasks;
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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
