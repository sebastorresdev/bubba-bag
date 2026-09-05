using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application;

public interface IRecursosHumanosDbContext
{
    DbSet<Empleado> Empleados { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

