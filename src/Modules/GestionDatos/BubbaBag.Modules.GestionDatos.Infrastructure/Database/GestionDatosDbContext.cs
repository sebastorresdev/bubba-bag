using System.Reflection;
using BubbaBag.Modules.GestionDatos.Application;
using BubbaBag.Modules.GestionDatos.Domain;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Database;

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

