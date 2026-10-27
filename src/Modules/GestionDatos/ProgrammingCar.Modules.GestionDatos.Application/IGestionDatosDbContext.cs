using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.GestionDatos.Domain;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.GestionDatos.Application;

public interface IGestionDatosDbContext
{
    DbSet<DataImportJob> DataImportJobs { get; }
    DbSet<DataImportJobError> DataImportJobErrors { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

