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

        var ventasDbContext = scope.ServiceProvider.GetService<BubbaBag.Modules.Ventas.Infrastructure.Database.VentasDbContext>();
        if (ventasDbContext != null)
        {
            await ventasDbContext.Database.MigrateAsync();
        }

        // 2. Ejecutar sembradores modulares en orden de dependencias
        await SeguridadSeeder.SeedAsync(scope.ServiceProvider);

        var rrhhLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<RecursosHumanosDbContext>>();
        await BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Seeders.RecursosHumanosSeeder.SeedAsync(rrhhDbContext, rrhhLogger);

        var sucursalesMap = await rrhhDbContext.Sucursales
            .ToDictionaryAsync(s => s.Codigo, s => s.Id);

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
            try
            {
                await inventarioDbContext.Database.ExecuteSqlRawAsync(
                    @"ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""Tipo"" integer NOT NULL DEFAULT 1;
                      ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""PrecioBase"" numeric(12,2) NOT NULL DEFAULT 0;
                      ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""CatalogoId"" uuid;");
            }
            catch { }

            var invLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<BubbaBag.Modules.Inventario.Infrastructure.Database.InventarioDbContext>>();
            await BubbaBag.Modules.Inventario.Infrastructure.Database.Seeders.InventarioSeeder.SeedAsync(inventarioDbContext, invLogger, sucursalesMap);
        }

        if (servicioCampoDbContext != null)
        {
            try
            {
                await servicioCampoDbContext.Database.ExecuteSqlRawAsync(
                    @"ALTER TABLE serviciocampo.""Servicios"" ADD COLUMN IF NOT EXISTS ""PrecioBase"" numeric(12,2) NOT NULL DEFAULT 0;
                      ALTER TABLE serviciocampo.""Servicios"" ADD COLUMN IF NOT EXISTS ""ProductoComercialId"" uuid;
                      DO $$
                      BEGIN
                          IF EXISTS (
                              SELECT 1 FROM information_schema.columns 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'CatalogosServicio' AND column_name = 'ContratanteId'
                          ) AND NOT EXISTS (
                              SELECT 1 FROM information_schema.columns 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'CatalogosServicio' AND column_name = 'ClienteId'
                          ) THEN
                              ALTER TABLE serviciocampo.""CatalogosServicio"" RENAME COLUMN ""ContratanteId"" TO ""ClienteId"";
                          END IF;
                      END $$;
                      ALTER TABLE serviciocampo.""CatalogosServicio"" ADD COLUMN IF NOT EXISTS ""ClienteId"" uuid;");
            }
            catch { }

            var scLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<BubbaBag.Modules.ServicioCampo.Infrastructure.Database.ServicioCampoDbContext>>();
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.RecursosYZonasSeeder.SeedAsync(servicioCampoDbContext, scLogger);
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.TarifaServicioSeeder.SeedAsync(servicioCampoDbContext, scLogger);
        }

        if (ventasDbContext != null)
        {
            try
            {
                await ventasDbContext.Database.ExecuteSqlRawAsync(
                    @"CREATE SCHEMA IF NOT EXISTS ventas;
                      CREATE TABLE IF NOT EXISTS ventas.""ListasPrecio"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""Codigo"" character varying(50),
                          ""Nombre"" character varying(150) NOT NULL,
                          ""Moneda"" character varying(10) NOT NULL DEFAULT 'PEN',
                          ""Descripcion"" character varying(300),
                          ""VigenciaDesde"" timestamp with time zone,
                          ""VigenciaHasta"" timestamp with time zone,
                          ""EsPredeterminada"" boolean NOT NULL DEFAULT false,
                          ""ClienteId"" uuid,
                          ""Activo"" boolean NOT NULL DEFAULT true
                      );
                      ALTER TABLE ventas.""ListasPrecio"" ADD COLUMN IF NOT EXISTS ""Codigo"" character varying(50);
                      ALTER TABLE ventas.""ListasPrecio"" ADD COLUMN IF NOT EXISTS ""ClienteId"" uuid;
                      CREATE TABLE IF NOT EXISTS ventas.""ListasPrecioItems"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""ListaPrecioId"" uuid NOT NULL REFERENCES ventas.""ListasPrecio""(""Id"") ON DELETE CASCADE,
                          ""ProductoId"" uuid NOT NULL,
                          ""PrecioUnitario"" numeric(12,2) NOT NULL DEFAULT 0
                      );
                      CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ListasPrecioItems_ListaPrecioId_ProductoId"" ON ventas.""ListasPrecioItems"" (""ListaPrecioId"", ""ProductoId"");");
            }
            catch { }

            var ventasLogger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<BubbaBag.Modules.Ventas.Infrastructure.Database.VentasDbContext>>();
            await BubbaBag.Modules.Ventas.Infrastructure.Database.Seeders.VentasSeeder.SeedAsync(ventasDbContext, ventasLogger);
        }
    }
}
