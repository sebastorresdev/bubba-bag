using System;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Seeders;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

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

        var servicioCampoDbContext = scope.ServiceProvider.GetService<ServicioCampoDbContext>();
        if (servicioCampoDbContext != null)
        {
            // Asegurar la existencia de los esquemas y tablas base antes de aplicar migraciones relacionales
            try
            {
                await servicioCampoDbContext.Database.ExecuteSqlRawAsync(
                    @"CREATE SCHEMA IF NOT EXISTS crm;
                      CREATE SCHEMA IF NOT EXISTS inventario;
                      CREATE SCHEMA IF NOT EXISTS serviciocampo;

                      CREATE TABLE IF NOT EXISTS crm.ubigeos (
                          ""Codigo"" character varying(10) NOT NULL PRIMARY KEY,
                          ""Departamento"" character varying(100) NOT NULL,
                          ""Provincia"" character varying(100) NOT NULL,
                          ""Distrito"" character varying(100) NOT NULL,
                          ""CapitalLegal"" character varying(150),
                          ""CodigoRegionNatural"" character varying(10),
                          ""RegionNatural"" character varying(50)
                      );

                      CREATE TABLE IF NOT EXISTS crm.clientes (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""CodigoCliente"" character varying(30) NOT NULL,
                          ""TipoPersona"" character varying(20) NOT NULL DEFAULT 'NATURAL',
                          ""TipoDocumento"" character varying(20) NOT NULL DEFAULT 'DNI',
                          ""DocumentoIdentidad"" character varying(30) NOT NULL,
                          ""Nombres"" character varying(120) NOT NULL,
                          ""Apellidos"" character varying(120),
                          ""RazonSocial"" character varying(200),
                          ""TelefonoPrincipal"" character varying(30) NOT NULL,
                          ""TelefonoSecundario"" character varying(30),
                          ""Email"" character varying(150),
                          ""Direccion"" character varying(250) NOT NULL,
                          ""UbigeoCodigo"" character varying(10) NOT NULL DEFAULT '',
                          ""ReferenciaUbicacion"" character varying(250),
                          ""CoordenadaLat"" numeric(10,7),
                          ""CoordenadaLng"" numeric(10,7),
                          ""EsClienteFacturacion"" boolean NOT NULL DEFAULT false,
                          ""EsClienteServicio"" boolean NOT NULL DEFAULT false,
                          ""Activo"" boolean NOT NULL DEFAULT true
                      );

                      CREATE TABLE IF NOT EXISTS inventario.""Productos"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""Codigo"" character varying(50) NOT NULL,
                          ""Nombre"" character varying(150) NOT NULL,
                          ""Descripcion"" character varying(300),
                          ""Categoria"" character varying(50) NOT NULL,
                          ""UnidadMedida"" character varying(30) NOT NULL,
                          ""EsSerializado"" boolean NOT NULL DEFAULT false,
                          ""Activo"" boolean NOT NULL DEFAULT true,
                          ""Tipo"" integer NOT NULL DEFAULT 1,
                          ""PrecioBase"" numeric(12,2) NOT NULL DEFAULT 0,
                          ""CatalogoId"" uuid
                      );

                      CREATE TABLE IF NOT EXISTS inventario.""Almacenes"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""Codigo"" character varying(50) NOT NULL,
                          ""Nombre"" character varying(150) NOT NULL,
                          ""Tipo"" integer NOT NULL,
                          ""Direccion"" character varying(250),
                          ""Telefono"" character varying(50),
                          ""SucursalId"" uuid,
                          ""RecursoTecnicoId"" uuid,
                          ""Activo"" boolean NOT NULL DEFAULT true
                      );

                      CREATE TABLE IF NOT EXISTS inventario.""UnidadesMedida"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""Codigo"" character varying(20) NOT NULL,
                          ""Nombre"" character varying(100) NOT NULL,
                          ""Abreviatura"" character varying(10) NOT NULL,
                          ""PermiteDecimales"" boolean NOT NULL DEFAULT false,
                          ""Descripcion"" character varying(300),
                          ""Activo"" boolean NOT NULL DEFAULT true
                      );

                      CREATE TABLE IF NOT EXISTS inventario.""CategoriasProducto"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""Nombre"" character varying(100) NOT NULL,
                          ""CategoriaPadreId"" uuid,
                          ""Descripcion"" character varying(300),
                          ""Activo"" boolean NOT NULL DEFAULT true
                      );

                      -- Asegurar compatibilidad de esquema
                      ALTER TABLE inventario.""CategoriasProducto"" DROP COLUMN IF EXISTS ""Codigo"";
                      ALTER TABLE inventario.""CategoriasProducto"" DROP COLUMN IF EXISTS ""Familia"";
                      ALTER TABLE inventario.""CategoriasProducto"" ADD COLUMN IF NOT EXISTS ""CategoriaPadreId"" uuid;
                      ALTER TABLE inventario.""Productos"" ALTER COLUMN ""Categoria"" DROP NOT NULL;

                      CREATE TABLE IF NOT EXISTS inventario.""ListasPrecios"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""Codigo"" character varying(50) NOT NULL UNIQUE,
                          ""Nombre"" character varying(150) NOT NULL,
                          ""Moneda"" character varying(10) NOT NULL DEFAULT 'PEN',
                          ""Descripcion"" character varying(300),
                          ""FechaInicio"" timestamp with time zone,
                          ""FechaFin"" timestamp with time zone,
                          ""Activo"" boolean NOT NULL DEFAULT true
                      );

                      CREATE TABLE IF NOT EXISTS inventario.""ElementosListaPrecios"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""ListaPreciosId"" uuid NOT NULL REFERENCES inventario.""ListasPrecios""(""Id"") ON DELETE CASCADE,
                          ""ProductoId"" uuid NOT NULL REFERENCES inventario.""Productos""(""Id"") ON DELETE CASCADE,
                          ""UnidadMedidaId"" uuid REFERENCES inventario.""UnidadesMedida""(""Id"") ON DELETE SET NULL,
                          ""Monto"" numeric(12,2) NOT NULL DEFAULT 0,
                          ""MetodoFijacion"" integer NOT NULL DEFAULT 1,
                          CONSTRAINT ""UQ_Lista_Producto_Unidad"" UNIQUE (""ListaPreciosId"", ""ProductoId"", ""UnidadMedidaId"")
                      );

                      ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""ListaPreciosPredeterminadaId"" uuid;

                      INSERT INTO inventario.""UnidadesMedida"" (""Id"", ""Codigo"", ""Nombre"", ""Abreviatura"", ""PermiteDecimales"", ""Descripcion"", ""Activo"")
                      VALUES 
                          ('a1111111-1111-1111-1111-111111111111', 'UND', 'Unidades', 'und', false, 'Unidad discreta estándar para equipos, piezas y accesorios', true),
                          ('a2222222-2222-2222-2222-222222222222', 'MTR', 'Metros', 'm', true, 'Metros lineales de cableado, ductos y canaletas (fraccionable)', true),
                          ('a3333333-3333-3333-3333-333333333333', 'ROL', 'Rollos', 'rol', false, 'Bobina o rollo completo de cable o cinta', true),
                          ('a4444444-4444-4444-4444-444444444444', 'CAJ', 'Cajas', 'cj', false, 'Caja de grapas, conectores o insumos al por mayor', true),
                          ('a5555555-5555-5555-5555-555555555555', 'KGM', 'Kilogramos', 'kg', true, 'Peso en masa o granel (fraccionable)', true),
                          ('a6666666-6666-6666-6666-666666666666', 'SRV', 'Servicio', 'srv', false, 'Prestación de trabajo u hora técnica de instalación', true)
                      ON CONFLICT (""Id"") DO NOTHING;

                      INSERT INTO inventario.""ListasPrecios"" (""Id"", ""Codigo"", ""Nombre"", ""Moneda"", ""Descripcion"", ""Activo"")
                      VALUES 
                          ('b1111111-1111-1111-1111-111111111111', 'LP-ESTANDAR', 'Tarifa General', 'PEN', 'Lista de precios estándar predeterminada para productos y servicios', true)
                      ON CONFLICT (""Id"") DO NOTHING;");
            }
            catch { }

            await servicioCampoDbContext.Database.MigrateAsync();
        }

        // 2. Ejecutar sembradores modulares en orden de dependencias
        await SeguridadSeeder.SeedAsync(scope.ServiceProvider);

        var rrhhLogger = scope.ServiceProvider.GetRequiredService<ILogger<RecursosHumanosDbContext>>();
        await BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Seeders.RecursosHumanosSeeder.SeedAsync(rrhhDbContext, rrhhLogger);

        var sucursalesMap = await rrhhDbContext.Sucursales
            .ToDictionaryAsync(s => s.Codigo, s => s.Id);

        if (servicioCampoDbContext != null)
        {
            var scLogger = scope.ServiceProvider.GetRequiredService<ILogger<ServicioCampoDbContext>>();

            try
            {
                await servicioCampoDbContext.Database.ExecuteSqlRawAsync(
                    @"UPDATE crm.clientes SET ""EsClienteFacturacion"" = TRUE WHERE ""TipoPersona"" = 'JURIDICA' AND ""EsClienteFacturacion"" = FALSE;
                      ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""Tipo"" integer NOT NULL DEFAULT 1;
                      ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""PrecioBase"" numeric(12,2) NOT NULL DEFAULT 0;
                      ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""CatalogoId"" uuid;");
            }
            catch { }

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

            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.UbigeoSeeder.SeedAsync(servicioCampoDbContext, scLogger);
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.ClienteSeeder.SeedAsync(servicioCampoDbContext, scLogger);
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.InventarioSeeder.SeedAsync(servicioCampoDbContext, scLogger, sucursalesMap);
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.RecursosYZonasSeeder.SeedAsync(servicioCampoDbContext, scLogger);
            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders.TiposTareaSeeder.SeedAsync(servicioCampoDbContext, scLogger);
        }
    }
}
