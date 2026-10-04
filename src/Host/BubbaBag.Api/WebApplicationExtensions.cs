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

        // 1. Aplicar migraciones de base de datos
        var seguridadDbContext = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();
        await seguridadDbContext.Database.MigrateAsync();

        var rrhhDbContext = scope.ServiceProvider.GetRequiredService<RecursosHumanosDbContext>();
        await rrhhDbContext.Database.MigrateAsync();

        var gestionDatosDbContext = scope.ServiceProvider.GetRequiredService<GestionDatosDbContext>();
        await gestionDatosDbContext.Database.ExecuteSqlRawAsync(
            """
            CREATE SCHEMA IF NOT EXISTS gestiondatos;

            CREATE TABLE IF NOT EXISTS gestiondatos."DataImportJobs" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "NombreArchivo" character varying(250) NOT NULL,
                "TipoRegistro" character varying(100) NOT NULL,
                "TamanoBytes" bigint NOT NULL DEFAULT 0,
                "Estado" character varying(50) NOT NULL,
                "ModoDuplicados" character varying(50) NOT NULL,
                "PermitirDuplicados" boolean NOT NULL DEFAULT false,
                "CreadoPor" character varying(150) NOT NULL,
                "FechaCreacion" timestamp with time zone NOT NULL,
                "FechaFinalizacion" timestamp with time zone,
                "TotalProcesados" integer NOT NULL DEFAULT 0,
                "TotalExitosos" integer NOT NULL DEFAULT 0,
                "TotalFallidos" integer NOT NULL DEFAULT 0,
                "TotalParciales" integer NOT NULL DEFAULT 0,
                "MapeoCamposJson" text,
                "ParametrosDelimitadorJson" text
            );

            ALTER TABLE gestiondatos."DataImportJobs"
                ADD COLUMN IF NOT EXISTS "TamanoBytes" bigint NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "PermitirDuplicados" boolean NOT NULL DEFAULT false;

            CREATE TABLE IF NOT EXISTS gestiondatos."DataImportJobErrors" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "DataImportJobId" uuid NOT NULL REFERENCES gestiondatos."DataImportJobs"("Id") ON DELETE CASCADE,
                "Fila" integer NOT NULL,
                "ClaveIdentificador" character varying(150),
                "Columna" character varying(150),
                "Mensaje" character varying(1000) NOT NULL,
                "ValorOriginal" character varying(1000)
            );

            UPDATE gestiondatos."DataImportJobs"
            SET "Estado" = 'Fallido'
            WHERE "Estado" = 'Procesando';
            """);

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
                      CREATE SCHEMA IF NOT EXISTS gestiondatos;

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
            await servicioCampoDbContext.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS inventario."Compras" (
                    "Id" uuid PRIMARY KEY, "Numero" varchar(40) NOT NULL,
                    "Proveedor" varchar(150) NOT NULL, "TipoDocumento" varchar(30) NOT NULL,
                    "NumeroDocumento" varchar(100) NOT NULL, "FechaDocumento" date NOT NULL,
                    "Moneda" varchar(3) NOT NULL, "AlmacenId" uuid NOT NULL REFERENCES inventario."Almacenes"("Id"),
                    "Observacion" varchar(500), "LineasJson" text NOT NULL, "Total" numeric(18,2) NOT NULL,
                    "UsuarioId" uuid NOT NULL, "FechaRegistro" timestamp with time zone NOT NULL
                );
                ALTER TABLE inventario."Compras" ADD COLUMN IF NOT EXISTS "Estado" varchar(50) NOT NULL DEFAULT 'Recibida';
                ALTER TABLE inventario."Compras" ALTER COLUMN "Estado" TYPE varchar(50);
                ALTER TABLE inventario."Compras" ALTER COLUMN "AlmacenId" DROP NOT NULL;
                DROP INDEX IF EXISTS inventario."IX_Compras_Proveedor_TipoDocumento_NumeroDocumento";
                CREATE UNIQUE INDEX "IX_Compras_Proveedor_TipoDocumento_NumeroDocumento"
                    ON inventario."Compras" ("Proveedor", "TipoDocumento", "NumeroDocumento") WHERE "NumeroDocumento" <> '';

                CREATE TABLE IF NOT EXISTS serviciocampo."UnidadesOrganizativas" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "Codigo" character varying(20) NOT NULL UNIQUE,
                    "Nombre" character varying(150) NOT NULL,
                    "Ciudad" character varying(100),
                    "Direccion" character varying(250),
                    "Telefono" character varying(50),
                    "EsSedePrincipal" boolean NOT NULL DEFAULT false,
                    "Activo" boolean NOT NULL DEFAULT true,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "UpdatedAt" timestamp with time zone
                );

                CREATE TABLE IF NOT EXISTS serviciocampo."ZonasOperativas" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "Codigo" character varying(50) NOT NULL UNIQUE,
                    "Nombre" character varying(150) NOT NULL,
                    "DescripcionProveedor" character varying(250),
                    "SucursalId" uuid NOT NULL,
                    "AlmacenPredeterminadoId" uuid,
                    "Activo" boolean NOT NULL DEFAULT true
                );

                CREATE TABLE IF NOT EXISTS serviciocampo."Recursos" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "Codigo" character varying(50) NOT NULL UNIQUE,
                    "NombreCompleto" character varying(150) NOT NULL,
                    "Tipo" integer NOT NULL DEFAULT 1,
                    "DocumentoIdentidad" character varying(30),
                    "Telefono" character varying(50),
                    "Email" character varying(150),
                    "UnidadOrganizativaId" uuid,
                    "ZonaOperativaId" uuid,
                    "AlmacenBaseId" uuid,
                    "AlmacenMovilId" uuid,
                    "UsuarioId" uuid,
                    "EmpleadoId" uuid,
                    "CapacidadMaximaOrdenesPorDia" integer NOT NULL DEFAULT 6,
                    "ColorHex" character varying(20) DEFAULT '#0078d4',
                    "Notas" character varying(500),
                    "Activo" boolean NOT NULL DEFAULT true
                );

                ALTER TABLE serviciocampo."Recursos" ADD COLUMN IF NOT EXISTS "Tipo" integer NOT NULL DEFAULT 1;
                ALTER TABLE serviciocampo."Recursos" ADD COLUMN IF NOT EXISTS "Notas" character varying(500);
                ALTER TABLE serviciocampo."Recursos" ADD COLUMN IF NOT EXISTS "UnidadOrganizativaId" uuid;
                ALTER TABLE serviciocampo."Recursos" ALTER COLUMN "ZonaOperativaId" DROP NOT NULL;
                ALTER TABLE serviciocampo."Recursos" ALTER COLUMN "AlmacenBaseId" DROP NOT NULL;

                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "Codigo" character varying(50);
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "Tipo" integer NOT NULL DEFAULT 1;
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "Descripcion" character varying(500);
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "UnidadOrganizativaId" uuid;
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "RecursoId" uuid;
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "CreadoPorId" uuid;
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "CreadoPorNombre" character varying(150);
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "ActualizadoPorId" uuid;
                ALTER TABLE inventario."Almacenes" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;
                UPDATE inventario."Almacenes" SET "Codigo" = 'ALM-' || UPPER(SUBSTRING(REPLACE("Id"::text, '-', ''), 1, 6)) WHERE "Codigo" IS NULL OR "Codigo" = '';

                CREATE TABLE IF NOT EXISTS inventario."UsuarioAlmacenAutorizaciones" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "UsuarioId" uuid NOT NULL,
                    "AlmacenId" uuid NOT NULL REFERENCES inventario."Almacenes"("Id") ON DELETE CASCADE,
                    "PuedeConsultar" boolean NOT NULL DEFAULT true,
                    "PuedeDespachar" boolean NOT NULL DEFAULT true,
                    "PuedeRecepcionar" boolean NOT NULL DEFAULT true,
                    "EsSupervisor" boolean NOT NULL DEFAULT false,
                    "Activo" boolean NOT NULL DEFAULT true,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "UpdatedAt" timestamp with time zone
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_UsuarioAlmacenAutorizaciones_Usuario_Almacen"
                    ON inventario."UsuarioAlmacenAutorizaciones" ("UsuarioId", "AlmacenId");

                CREATE TABLE IF NOT EXISTS inventario."Transferencias" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "Numero" character varying(50) NOT NULL UNIQUE,
                    "AlmacenOrigenId" uuid NOT NULL REFERENCES inventario."Almacenes"("Id"),
                    "AlmacenDestinoId" uuid NOT NULL REFERENCES inventario."Almacenes"("Id"),
                    "UnidadOrganizativaOrigenId" uuid NOT NULL,
                    "UnidadOrganizativaDestinoId" uuid NOT NULL,
                    "Modalidad" integer NOT NULL,
                    "Estado" integer NOT NULL,
                    "FechaRegistro" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "FechaDespacho" timestamp with time zone,
                    "FechaCierre" timestamp with time zone,
                    "DespachadoPorId" uuid,
                    "DespachadoPorNombre" character varying(150),
                    "NumeroGuiaRemision" character varying(100),
                    "Observaciones" character varying(500)
                );

                CREATE TABLE IF NOT EXISTS inventario."TransferenciaDetalles" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "TransferenciaId" uuid NOT NULL REFERENCES inventario."Transferencias"("Id") ON DELETE CASCADE,
                    "ProductoId" uuid NOT NULL,
                    "CantidadEnviada" numeric(18,4) NOT NULL,
                    "CantidadRecibida" numeric(18,4) NOT NULL DEFAULT 0,
                    "CantidadResuelta" numeric(18,4) NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS inventario."TransferenciaDetalleSeries" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "TransferenciaDetalleId" uuid NOT NULL REFERENCES inventario."TransferenciaDetalles"("Id") ON DELETE CASCADE,
                    "ItemSeriadoId" uuid NOT NULL,
                    "NumeroSerie" character varying(100) NOT NULL,
                    "Recibida" boolean NOT NULL DEFAULT false,
                    "TieneIncidencia" boolean NOT NULL DEFAULT false,
                    "MotivoIncidencia" character varying(250)
                );

                CREATE TABLE IF NOT EXISTS inventario."RecepcionesTransferencia" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "NumeroRecepcion" character varying(50) NOT NULL UNIQUE,
                    "TransferenciaId" uuid NOT NULL REFERENCES inventario."Transferencias"("Id") ON DELETE CASCADE,
                    "FechaRecepcion" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "RecibidoPorId" uuid NOT NULL,
                    "RecibidoPorNombre" character varying(150) NOT NULL,
                    "Observaciones" character varying(500)
                );

                CREATE TABLE IF NOT EXISTS inventario."RecepcionTransferenciaDetalles" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "RecepcionTransferenciaId" uuid NOT NULL REFERENCES inventario."RecepcionesTransferencia"("Id") ON DELETE CASCADE,
                    "TransferenciaDetalleId" uuid NOT NULL,
                    "ProductoId" uuid NOT NULL,
                    "CantidadAceptada" numeric(18,4) NOT NULL,
                    "SeriesAceptadasJson" text
                );

                CREATE TABLE IF NOT EXISTS inventario."ResolucionDiferenciaTransferencias" (
                    "Id" uuid NOT NULL PRIMARY KEY,
                    "TransferenciaId" uuid NOT NULL REFERENCES inventario."Transferencias"("Id") ON DELETE CASCADE,
                    "TransferenciaDetalleId" uuid NOT NULL,
                    "CantidadAfectada" numeric(18,4) NOT NULL,
                    "Resultado" integer NOT NULL,
                    "Motivo" character varying(500) NOT NULL,
                    "EvidenciaDocumentaria" character varying(500),
                    "SupervisorId" uuid NOT NULL,
                    "SupervisorNombre" character varying(150) NOT NULL,
                    "FechaResolucion" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """);
        }

        // Únicamente definiciones técnicas de roles, sin cuentas ni datos de ejemplo.
        await CatalogoRolesSistema.AsegurarAsync(scope.ServiceProvider);

        if (servicioCampoDbContext != null)
        {

            try
            {
                await servicioCampoDbContext.Database.ExecuteSqlRawAsync(
                    @"ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""Tipo"" integer NOT NULL DEFAULT 1;
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
                      ALTER TABLE serviciocampo.""Recursos"" ADD COLUMN IF NOT EXISTS ""UnidadOrganizativaId"" uuid;
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

            await BubbaBag.Modules.ServicioCampo.Infrastructure.Database.MigracionUbicacionesInventario.AplicarAsync(servicioCampoDbContext);
        }
    }
}
