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
                      CREATE SCHEMA IF NOT EXISTS GestionDatos;

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
                          ""DecimalesCantidad"" integer NOT NULL DEFAULT 0,
                          ""CatalogoId"" uuid,
                          CONSTRAINT ""CK_Productos_DecimalesCantidad"" CHECK (""DecimalesCantidad"" BETWEEN 0 AND 5)
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
                      ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""DecimalesCantidad"" integer NOT NULL DEFAULT 0;

                      INSERT INTO inventario.""UnidadesMedida"" (""Id"", ""Codigo"", ""Nombre"", ""Abreviatura"", ""Descripcion"", ""Activo"")
                      VALUES 
                          ('a1111111-1111-1111-1111-111111111111', 'UND', 'Unidades', 'und', 'Unidad para equipos, piezas y accesorios', true),
                          ('a2222222-2222-2222-2222-222222222222', 'MTR', 'Metros', 'm', 'Medida de longitud para cableado, ductos y canaletas', true),
                          ('a3333333-3333-3333-3333-333333333333', 'ROL', 'Rollos', 'rol', 'Bobina o rollo de cable o cinta', true),
                          ('a4444444-4444-4444-4444-444444444444', 'CAJ', 'Cajas', 'cj', 'Caja de grapas, conectores o insumos al por mayor', true),
                          ('a5555555-5555-5555-5555-555555555555', 'KGM', 'Kilogramos', 'kg', 'Unidad de peso en masa', true),
                          ('a6666666-6666-6666-6666-666666666666', 'SRV', 'Servicio', 'srv', 'Prestación de trabajo o servicio técnico', true)
                      ON CONFLICT (""Id"") DO NOTHING;

                      INSERT INTO inventario.""ListasPrecios"" (""Id"", ""Codigo"", ""Nombre"", ""Moneda"", ""Descripcion"", ""Activo"")
                      VALUES 
                          ('b1111111-1111-1111-1111-111111111111', 'LP-ESTANDAR', 'Tarifa General', 'PEN', 'Lista de precios estándar predeterminada para productos y servicios', true)
                      ON CONFLICT (""Id"") DO NOTHING;

                      CREATE TABLE IF NOT EXISTS serviciocampo.""DataImportJobs"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""NombreArchivo"" character varying(250) NOT NULL,
                          ""TipoRegistro"" character varying(100) NOT NULL,
                          ""TamanoBytes"" bigint NOT NULL DEFAULT 0,
                          ""Estado"" character varying(50) NOT NULL DEFAULT 'Completado',
                          ""ModoDuplicados"" character varying(50) NOT NULL DEFAULT 'Upsert',
                          ""PermitirDuplicados"" boolean NOT NULL DEFAULT false,
                          ""CreadoPor"" character varying(150) NOT NULL DEFAULT 'Usuario Actual',
                          ""FechaCreacion"" timestamp with time zone NOT NULL DEFAULT NOW(),
                          ""FechaFinalizacion"" timestamp with time zone,
                          ""TotalProcesados"" integer NOT NULL DEFAULT 0,
                          ""TotalExitosos"" integer NOT NULL DEFAULT 0,
                          ""TotalFallidos"" integer NOT NULL DEFAULT 0,
                          ""TotalParciales"" integer NOT NULL DEFAULT 0,
                          ""MapeoCamposJson"" text,
                          ""ParametrosDelimitadorJson"" text
                      );

                      CREATE TABLE IF NOT EXISTS serviciocampo.""DataImportJobErrors"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""DataImportJobId"" uuid NOT NULL REFERENCES serviciocampo.""DataImportJobs""(""Id"") ON DELETE CASCADE,
                          ""Fila"" integer NOT NULL,
                          ""ClaveIdentificador"" character varying(150),
                          ""Columna"" character varying(150),
                          ""Mensaje"" character varying(1000) NOT NULL,
                          ""ValorOriginal"" character varying(1000)
                      );

                      UPDATE serviciocampo.""DataImportJobs"" SET ""Estado"" = 'Fallido' WHERE ""Estado"" = 'Procesando';");
            }
            catch { }

            await servicioCampoDbContext.Database.MigrateAsync();
            try
            {
                await servicioCampoDbContext.Database.ExecuteSqlRawAsync(
                    @"UPDATE serviciocampo.""DataImportJobs"" 
                      SET ""CreadoPor"" = 'Sebastián Torres' 
                      WHERE ""CreadoPor"" = 'Usuario del Sistema' OR ""CreadoPor"" IS NULL;");
            }
            catch { }
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
                      ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""CatalogoId"";");
            }
            catch { }

            try
            {
                await servicioCampoDbContext.Database.ExecuteSqlRawAsync(
                    @"DO $$
                      BEGIN
                          IF EXISTS (
                              SELECT 1 FROM information_schema.tables 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'RecursosTecnicos'
                          ) AND NOT EXISTS (
                              SELECT 1 FROM information_schema.tables 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'Recursos'
                          ) THEN
                              ALTER TABLE serviciocampo.""RecursosTecnicos"" RENAME TO ""Recursos"";
                          END IF;
                      END $$;

                      CREATE TABLE IF NOT EXISTS serviciocampo.""Recursos"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""Codigo"" character varying(50) NOT NULL UNIQUE,
                          ""NombreCompleto"" character varying(150) NOT NULL,
                          ""Tipo"" integer NOT NULL DEFAULT 1,
                          ""DocumentoIdentidad"" character varying(30),
                          ""Telefono"" character varying(50),
                          ""Email"" character varying(150),
                          ""ZonaOperativaId"" uuid,
                          ""AlmacenBaseId"" uuid,
                          ""AlmacenMovilId"" uuid,
                          ""UsuarioId"" uuid,
                          ""EmpleadoId"" uuid,
                          ""CapacidadMaximaOrdenesPorDia"" integer NOT NULL DEFAULT 6,
                          ""ColorHex"" character varying(20) DEFAULT '#0078d4',
                          ""Notas"" character varying(500),
                          ""Activo"" boolean NOT NULL DEFAULT true
                      );

                      ALTER TABLE serviciocampo.""Recursos"" ADD COLUMN IF NOT EXISTS ""Tipo"" integer NOT NULL DEFAULT 1;
                      ALTER TABLE serviciocampo.""Recursos"" ADD COLUMN IF NOT EXISTS ""Notas"" character varying(500);
                      ALTER TABLE serviciocampo.""Recursos"" ALTER COLUMN ""ZonaOperativaId"" DROP NOT NULL;
                      ALTER TABLE serviciocampo.""Recursos"" ALTER COLUMN ""AlmacenBaseId"" DROP NOT NULL;

                      ALTER TABLE serviciocampo.""OrdenTrabajoVisitas"" ADD COLUMN IF NOT EXISTS ""RecursoId"" uuid;
                      DO $$
                      BEGIN
                          IF EXISTS (
                              SELECT 1 FROM information_schema.columns 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'OrdenTrabajoVisitas' AND column_name = 'RecursoTecnicoId'
                          ) THEN
                              UPDATE serviciocampo.""OrdenTrabajoVisitas"" SET ""RecursoId"" = ""RecursoTecnicoId"" WHERE ""RecursoId"" IS NULL;
                          END IF;
                      END $$;

                      ALTER TABLE inventario.""Almacenes"" ADD COLUMN IF NOT EXISTS ""RecursoId"" uuid;
                      DO $$
                      BEGIN
                          IF EXISTS (
                              SELECT 1 FROM information_schema.columns 
                              WHERE table_schema = 'inventario' AND table_name = 'Almacenes' AND column_name = 'RecursoTecnicoId'
                          ) THEN
                              UPDATE inventario.""Almacenes"" SET ""RecursoId"" = ""RecursoTecnicoId"" WHERE ""RecursoId"" IS NULL;
                          END IF;
                      END $$;

                      ALTER TABLE inventario.""Almacenes"" ADD COLUMN IF NOT EXISTS ""Descripcion"" character varying(500);
                      DELETE FROM inventario.""Almacenes"" WHERE ""Codigo"" LIKE 'ALM-BASE-%';

                      UPDATE seguridad.""AspNetUsers""
                      SET ""UserName"" = 'admin@skvia.com',
                          ""NormalizedUserName"" = 'ADMIN@SKVIA.COM',
                          ""Email"" = 'admin@skvia.com',
                          ""NormalizedEmail"" = 'ADMIN@SKVIA.COM',
                          ""NombreCompleto"" = 'Sebastian Torres'
                      WHERE ""Email"" = 'admin@bubbabag.com' OR ""UserName"" = 'admin@bubbabag.com' OR ""Id"" = '00000000-0000-0000-0000-000000000001';

                      ALTER TABLE serviciocampo.""PlantillasTrabajo"" ADD COLUMN IF NOT EXISTS ""ProductoId"" uuid;
                      DO $$
                      BEGIN
                          IF EXISTS (
                              SELECT 1 FROM information_schema.columns 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'PlantillasTrabajo' AND column_name = 'ServicioId'
                          ) THEN
                              UPDATE serviciocampo.""PlantillasTrabajo"" SET ""ProductoId"" = ""ServicioId"" WHERE ""ProductoId"" IS NULL;
                          END IF;
                      END $$;

                      ALTER TABLE serviciocampo.""Trabajos"" ADD COLUMN IF NOT EXISTS ""ProductoId"" uuid;
                      DO $$
                      BEGIN
                          IF EXISTS (
                              SELECT 1 FROM information_schema.columns 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'Trabajos' AND column_name = 'ServicioId'
                          ) THEN
                              UPDATE serviciocampo.""Trabajos"" SET ""ProductoId"" = ""ServicioId"" WHERE ""ProductoId"" IS NULL;
                          END IF;
                      END $$;

                      DO $$
                      BEGIN
                          IF EXISTS (
                              SELECT 1 FROM information_schema.tables 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'DataImportJobs'
                          ) AND NOT EXISTS (
                              SELECT 1 FROM information_schema.tables 
                              WHERE table_schema = 'GestionDatos' AND table_name = 'DataImportJobs'
                          ) THEN
                              ALTER TABLE serviciocampo.""DataImportJobs"" SET SCHEMA GestionDatos;
                          END IF;

                          IF EXISTS (
                              SELECT 1 FROM information_schema.tables 
                              WHERE table_schema = 'serviciocampo' AND table_name = 'DataImportJobErrors'
                          ) AND NOT EXISTS (
                              SELECT 1 FROM information_schema.tables 
                              WHERE table_schema = 'GestionDatos' AND table_name = 'DataImportJobErrors'
                          ) THEN
                              ALTER TABLE serviciocampo.""DataImportJobErrors"" SET SCHEMA GestionDatos;
                          END IF;
                      END $$;

                      CREATE TABLE IF NOT EXISTS GestionDatos.""DataImportJobs"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""NombreArchivo"" character varying(250) NOT NULL,
                          ""TipoRegistro"" character varying(100) NOT NULL,
                          ""Estado"" character varying(50) NOT NULL,
                          ""ModoDuplicados"" character varying(50) NOT NULL,
                          ""CreadoPor"" character varying(150) NOT NULL,
                          ""FechaCreacion"" timestamp with time zone NOT NULL,
                          ""FechaFinalizacion"" timestamp with time zone,
                          ""TotalProcesados"" integer NOT NULL DEFAULT 0,
                          ""TotalExitosos"" integer NOT NULL DEFAULT 0,
                          ""TotalFallidos"" integer NOT NULL DEFAULT 0,
                          ""TotalParciales"" integer NOT NULL DEFAULT 0,
                          ""MapeoCamposJson"" text,
                          ""ParametrosDelimitadorJson"" text
                      );

                      CREATE TABLE IF NOT EXISTS GestionDatos.""DataImportJobErrors"" (
                          ""Id"" uuid NOT NULL PRIMARY KEY,
                          ""DataImportJobId"" uuid NOT NULL,
                          ""Fila"" integer NOT NULL,
                          ""ClaveIdentificador"" character varying(150),
                          ""Columna"" character varying(150),
                          ""Mensaje"" character varying(1000) NOT NULL,
                          ""ValorOriginal"" character varying(1000)
                      );");
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

