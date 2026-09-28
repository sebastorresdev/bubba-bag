using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.GestionDatos.Domain;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.GestionDatos.Application;

public interface IGestionDatosDbContext
{
    DbSet<DataImportJob> DataImportJobs { get; }
    DbSet<DataImportJobError> DataImportJobErrors { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

