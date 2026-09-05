using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application;

public interface IRecursosHumanosDbContext
{
    DbSet<Empleado> Empleados { get; }
    DbSet<Departamento> Departamentos { get; }
    DbSet<Cargo> Cargos { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
