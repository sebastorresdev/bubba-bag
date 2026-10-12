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

        // Marcar jobs de importación inconclusos como fallidos tras reinicio
        await gestionDatosDbContext.Database.ExecuteSqlRawAsync("""
            UPDATE gestiondatos."DataImportJobs"
            SET "Estado" = 'Fallido'
            WHERE "Estado" = 'Procesando';
        """);

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

            // Asegurar tabla pública de configuración de empresa si no existe
            await servicioCampoDbContext.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS public."ConfiguracionEmpresa" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "RazonSocial" character varying(250) NOT NULL,
                    "NombreComercial" character varying(250),
                    "Ruc" character varying(50),
                    "DireccionFiscal" character varying(300),
                    "Telefono" character varying(50),
                    "Email" character varying(150),
                    "LogoBase64" text,
                    "PiePaginaDocumentos" character varying(500),
                    "FechaActualizacion" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                INSERT INTO public."ConfiguracionEmpresa" ("Id", "RazonSocial", "NombreComercial", "Ruc", "DireccionFiscal", "Telefono", "Email", "PiePaginaDocumentos", "FechaActualizacion")
                VALUES ('11111111-1111-1111-1111-111111111111', 'BUBBA BAG LOGISTICS', 'BubbaBag', '20601234567', 'Av. Principal 123, Lima, Perú', '(01) 555-1234', 'contacto@bubbabag.com', 'Documento oficial de control y custodia de existencias.', NOW())
                ON CONFLICT ("Id") DO NOTHING;
            """);
        }
    }
}
