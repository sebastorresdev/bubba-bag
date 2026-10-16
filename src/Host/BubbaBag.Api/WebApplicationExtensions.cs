using System;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Seeders;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using BubbaBag.Modules.GestionDatos.Infrastructure.Database;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Api;

public static class WebApplicationExtensions
{
    public static async Task ApplyMigrationsAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        // 1. Aplicar migraciones formales de base de datos
        var seguridadDbContext = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();
        await seguridadDbContext.Database.MigrateAsync();

        var rrhhDbContext = scope.ServiceProvider.GetRequiredService<RecursosHumanosDbContext>();
        await rrhhDbContext.Database.MigrateAsync();

        var gestionDatosDbContext = scope.ServiceProvider.GetRequiredService<GestionDatosDbContext>();
        await gestionDatosDbContext.Database.MigrateAsync();

        // Marcar jobs de importación inconclusos como fallidos tras reinicio (solo jobs zombis con más de 2h)
        var limiteZombi = DateTime.UtcNow.AddHours(-2);
        await gestionDatosDbContext.DataImportJobs
            .Where(j => j.Estado == "Procesando" && j.FechaCreacion < limiteZombi)
            .ExecuteUpdateAsync(s => s.SetProperty(j => j.Estado, "Fallido"));

        var servicioCampoDbContext = scope.ServiceProvider.GetService<ServicioCampoDbContext>();
        if (servicioCampoDbContext != null)
        {
            await servicioCampoDbContext.Database.MigrateAsync();
        }

        // 2. Catálogo de roles del sistema
        await CatalogoRolesSistema.AsegurarAsync(scope.ServiceProvider);

        // 3. Seeders esenciales de Servicio de Campo e Inventario
        if (servicioCampoDbContext != null)
        {
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.InventarioSeeder.AsegurarUnidadesMedidaAsync(servicioCampoDbContext);
            
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<WebApplication>>();
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.UbigeoSeeder.SeedAsync(servicioCampoDbContext, logger);
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.MotivosIncidenciaSeeder.SeedAsync(servicioCampoDbContext, logger);

            // Asegurar registro inicial de configuración de empresa mediante EF Core
            if (!await servicioCampoDbContext.ConfiguracionEmpresas.AnyAsync())
            {
                var empresaDefault = BubbaBag.Modules.ServicioCampo.Domain.Configuracion.ConfiguracionEmpresa.CrearDefault();
                await servicioCampoDbContext.ConfiguracionEmpresas.AddAsync(empresaDefault);
                await servicioCampoDbContext.SaveChangesAsync();
            }
        }
    }
}
