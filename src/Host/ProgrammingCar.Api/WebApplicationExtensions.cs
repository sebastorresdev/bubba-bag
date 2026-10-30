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

        var seguridadDbContext = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();

        // Sincronizar historial si la base de datos ya tenía tablas previas al reinicio de migraciones
        await SincronizarHistorialMigracionesAsync(seguridadDbContext.Database);

        // 1. Aplicar migraciones formales de base de datos
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

    private static async Task SincronizarHistorialMigracionesAsync(Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade database)
    {
        await database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                ""MigrationId"" character varying(150) NOT NULL PRIMARY KEY,
                ""ProductVersion"" character varying(32) NOT NULL
            );

            DELETE FROM ""__EFMigrationsHistory""
            WHERE ""MigrationId"" IN (
                '20261012213457_InicialGestionDatos',
                '20261014163556_AutorImportacionAutenticado',
                '20261014200830_ReintentosImportacionInventario',
                '20261022040929_InicialServicioCampo'
            );

            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'gestiondatos' AND table_name = 'DataImportJobs') THEN
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20261030015202_InicialGestionDatos', '10.0.12')
                    ON CONFLICT (""MigrationId"") DO NOTHING;
                END IF;
            END $$;

            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'serviciocampo' AND table_name = 'ordenes_trabajo') THEN
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20261030014955_InicialServicioCampo', '10.0.12')
                    ON CONFLICT (""MigrationId"") DO NOTHING;
                END IF;
            END $$;
        ");
    }
}
