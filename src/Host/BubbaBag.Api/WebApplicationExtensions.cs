using System;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Seeders;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Api;

public static class WebApplicationExtensions
{
    public static async Task ApplyMigrationsAndSeedAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        
        // 1. Aplicar migraciones de base de datos
        var seguridadDbContext = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();
        await seguridadDbContext.Database.MigrateAsync();

        var rrhhDbContext = scope.ServiceProvider.GetRequiredService<RecursosHumanosDbContext>();
        await rrhhDbContext.Database.MigrateAsync();
        await rrhhDbContext.Database.ExecuteSqlRawAsync("UPDATE rrhh.\"Empleados\" SET \"Email\" = NULL WHERE \"Email\" = '';");

        // 2. Ejecutar sembradores modulares
        await SeguridadSeeder.SeedAsync(scope.ServiceProvider);

        var rrhhLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<RecursosHumanosDbContext>>();
        await BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Seeders.RecursosHumanosSeeder.SeedAsync(rrhhDbContext, rrhhLogger);
    }
}
