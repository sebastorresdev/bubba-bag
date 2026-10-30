using System;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database;
using ProgrammingCar.Modules.Seguridad.Infrastructure.Persistence;
using ProgrammingCar.Modules.Seguridad.Infrastructure.Persistence.Seeders;
using ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database;
using ProgrammingCar.Modules.GestionDatos.Infrastructure.Database;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ProgrammingCar.Api;

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
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<WebApplication>>();
            await ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Seeders.UbigeoSeeder.SeedAsync(servicioCampoDbContext, logger);
            await ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Seeders.MotivosIncidenciaSeeder.SeedAsync(servicioCampoDbContext, logger);
            await ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Seeders.InventarioSeeder.SeedAsync(servicioCampoDbContext, logger);

            // Asegurar registro inicial de configuración de empresa mediante EF Core
            var empresaExistente = await servicioCampoDbContext.ConfiguracionEmpresas.FirstOrDefaultAsync();
            if (empresaExistente == null)
            {
                var empresaDefault = ProgrammingCar.Modules.ServicioCampo.Domain.Configuracion.ConfiguracionEmpresa.CrearDefault();
                await servicioCampoDbContext.ConfiguracionEmpresas.AddAsync(empresaDefault);
                await servicioCampoDbContext.SaveChangesAsync();
            }
            else if (empresaExistente.RazonSocial == "PROGRAMMING CAR" || empresaExistente.NombreComercial == "ProgrammingCar")
            {
                empresaExistente.Actualizar(
                    razonSocial: "PROGRAMMING CAR",
                    nombreComercial: "PROGRAMMING CAR",
                    ruc: empresaExistente.Ruc,
                    direccionFiscal: empresaExistente.DireccionFiscal,
                    telefono: empresaExistente.Telefono,
                    email: empresaExistente.Email == "contacto@bubbabag.com" ? "contacto@programmingcar.com" : empresaExistente.Email,
                    logoBase64: empresaExistente.LogoBase64,
                    piePaginaDocumentos: empresaExistente.PiePaginaDocumentos);
                await servicioCampoDbContext.SaveChangesAsync();
            }
        }
    }
}
