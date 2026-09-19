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

        var crmDbContext = scope.ServiceProvider.GetService<BubbaBag.Modules.Crm.Infrastructure.Database.CrmDbContext>();
        if (crmDbContext != null)
        {
            await crmDbContext.Database.MigrateAsync();
        }

        var inventarioDbContext = scope.ServiceProvider.GetService<BubbaBag.Modules.Inventario.Infrastructure.Database.InventarioDbContext>();
        if (inventarioDbContext != null)
        {
            await inventarioDbContext.Database.MigrateAsync();
        }

        var servicioCampoDbContext = scope.ServiceProvider.GetService<BubbaBag.Modules.ServicioCampo.Infrastructure.Database.ServicioCampoDbContext>();
        if (servicioCampoDbContext != null)
        {
            await servicioCampoDbContext.Database.MigrateAsync();
        }

        // 2. Ejecutar sembradores modulares en orden de dependencias
        await SeguridadSeeder.SeedAsync(scope.ServiceProvider);

        var rrhhLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<RecursosHumanosDbContext>>();
        await BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Seeders.RecursosHumanosSeeder.SeedAsync(rrhhDbContext, rrhhLogger);

        if (crmDbContext != null)
        {
            var crmLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<BubbaBag.Modules.Crm.Infrastructure.Database.CrmDbContext>>();
            await BubbaBag.Modules.Crm.Infrastructure.Database.Seeders.UbigeoSeeder.SeedAsync(crmDbContext, crmLogger);
            await BubbaBag.Modules.Crm.Infrastructure.Database.Seeders.ClienteSeeder.SeedAsync(crmDbContext, crmLogger);

            try
            {
                await crmDbContext.Database.ExecuteSqlRawAsync(
                    @"UPDATE crm.clientes SET ""EsClienteFacturacion"" = TRUE WHERE ""TipoPersona"" = 'JURIDICA' AND ""EsClienteFacturacion"" = FALSE;");
            }
            catch
            {
                // Ignorar si aún no existe la tabla o campos
            }
        }

        if (inventarioDbContext != null)
        {
            var invLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<BubbaBag.Modules.Inventario.Infrastructure.Database.InventarioDbContext>>();
            await BubbaBag.Modules.Inventario.Infrastructure.Database.Seeders.InventarioSeeder.SeedAsync(inventarioDbContext, invLogger);
        }

        if (servicioCampoDbContext != null)
        {
            var scLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<BubbaBag.Modules.ServicioCampo.Infrastructure.Database.ServicioCampoDbContext>>();
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.TarifaServicioSeeder.SeedAsync(servicioCampoDbContext, scLogger);
        }
    }
}
