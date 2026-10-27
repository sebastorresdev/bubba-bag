using System.Reflection;
using ProgrammingCar.Modules.GestionDatos.Application;
using ProgrammingCar.Modules.GestionDatos.Domain;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.GestionDatos.Infrastructure.Database;

public class GestionDatosDbContext : DbContext, IGestionDatosDbContext
{
    public GestionDatosDbContext(DbContextOptions<GestionDatosDbContext> options) : base(options)
    {
    }

    public DbSet<DataImportJob> DataImportJobs => Set<DataImportJob>();
    public DbSet<DataImportJobError> DataImportJobErrors => Set<DataImportJobError>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}

