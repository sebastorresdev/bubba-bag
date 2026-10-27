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
            // Sincronizar esquema existente e historial de migraciones cuando se consolidan migraciones en InicialServicioCampo
            await servicioCampoDbContext.Database.ExecuteSqlRawAsync(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'inventario' AND table_name = 'Almacenes'
                    ) THEN
                        CREATE SCHEMA IF NOT EXISTS crm;

                        CREATE TABLE IF NOT EXISTS crm.contactos (
                            ""Id"" uuid NOT NULL PRIMARY KEY,
                            ""Nombres"" character varying(120) NOT NULL,
                            ""Apellidos"" character varying(120) NOT NULL,
                            ""Cargo"" character varying(120) NULL,
                            ""CuentaId"" uuid NULL,
                            ""Email"" character varying(150) NULL,
                            ""TelefonoMovil"" character varying(30) NOT NULL,
                            ""TelefonoTrabajo"" character varying(30) NULL,
                            ""Direccion"" character varying(250) NULL,
                            ""UbigeoCodigo"" character varying(10) NULL,
                            ""Activo"" boolean NOT NULL DEFAULT TRUE,
                            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT ""FK_contactos_clientes_CuentaId"" FOREIGN KEY (""CuentaId"") REFERENCES crm.clientes (""Id"") ON DELETE SET NULL,
                            CONSTRAINT ""FK_contactos_ubigeos_UbigeoCodigo"" FOREIGN KEY (""UbigeoCodigo"") REFERENCES crm.ubigeos (""Codigo"") ON DELETE RESTRICT
                        );

                        ALTER TABLE crm.contactos ADD COLUMN IF NOT EXISTS ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;
                        ALTER TABLE crm.contactos ALTER COLUMN ""UbigeoCodigo"" TYPE character varying(10);
                        ALTER TABLE crm.contactos DROP COLUMN IF EXISTS ""NombreCompleto"";

                        CREATE INDEX IF NOT EXISTS ""IX_contactos_CuentaId"" ON crm.contactos (""CuentaId"");
                        CREATE INDEX IF NOT EXISTS ""IX_contactos_UbigeoCodigo"" ON crm.contactos (""UbigeoCodigo"");

                        ALTER TABLE crm.clientes ADD COLUMN IF NOT EXISTS ""ContactoPrincipalId"" uuid NULL;
                        ALTER TABLE crm.clientes ADD COLUMN IF NOT EXISTS ""CodigoExterno"" character varying(60) NULL;
                        CREATE INDEX IF NOT EXISTS ""IX_clientes_CodigoExterno"" ON crm.clientes (""CodigoExterno"");

                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE constraint_name = 'FK_clientes_contactos_ContactoPrincipalId'
                        ) THEN
                            ALTER TABLE crm.clientes
                                ADD CONSTRAINT ""FK_clientes_contactos_ContactoPrincipalId""
                                FOREIGN KEY (""ContactoPrincipalId"") REFERENCES crm.contactos (""Id"") ON DELETE SET NULL;
                        END IF;

                        CREATE INDEX IF NOT EXISTS ""IX_clientes_ContactoPrincipalId"" ON crm.clientes (""ContactoPrincipalId"");

                        ALTER TABLE serviciocampo.""Tareas"" DROP COLUMN IF EXISTS ""Codigo"";

                        ALTER TABLE serviciocampo.""PlantillasTrabajo"" ADD COLUMN IF NOT EXISTS ""Puntos"" numeric(5,2) NOT NULL DEFAULT 1.0;
                        ALTER TABLE serviciocampo.""Trabajos"" ADD COLUMN IF NOT EXISTS ""Puntos"" numeric(5,2) NOT NULL DEFAULT 1.0;

                        CREATE TABLE IF NOT EXISTS serviciocampo.""PlantillasTrabajoServicios"" (
                            ""Id"" uuid NOT NULL PRIMARY KEY,
                            ""ConfiguracionServicioId"" uuid NOT NULL,
                            ""ProductoId"" uuid NOT NULL,
                            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                        );

                        CREATE INDEX IF NOT EXISTS ""IX_PlantillasTrabajoServicios_ConfiguracionServicioId"" ON serviciocampo.""PlantillasTrabajoServicios"" (""ConfiguracionServicioId"");
                        CREATE INDEX IF NOT EXISTS ""IX_PlantillasTrabajoServicios_ProductoId"" ON serviciocampo.""PlantillasTrabajoServicios"" (""ProductoId"");

                        DROP INDEX IF EXISTS serviciocampo.""IX_PlantillasTrabajo_ServicioId"";

                        INSERT INTO serviciocampo.""PlantillasTrabajoServicios"" (""Id"", ""ConfiguracionServicioId"", ""ProductoId"")
                        SELECT gen_random_uuid(), ""Id"", ""ServicioId""
                        FROM serviciocampo.""PlantillasTrabajo""
                        WHERE ""ServicioId"" IS NOT NULL
                          AND NOT EXISTS (
                              SELECT 1 FROM serviciocampo.""PlantillasTrabajoServicios"" pts 
                              WHERE pts.""ConfiguracionServicioId"" = serviciocampo.""PlantillasTrabajo"".""Id"" 
                                AND pts.""ProductoId"" = serviciocampo.""PlantillasTrabajo"".""ServicioId""
                          );

                        DELETE FROM public.""__EFMigrationsHistory""
                        WHERE ""MigrationId"" IN (
                            '20261014055112_InicialServicioCampo',
                            '20261014163836_PrecisionCantidadAjustes',
                            '20261014200825_CicloOrdenesYObservaciones',
                            '20261014201519_PersistirObservacionesOrden',
                            '20261014233709_SlaConfiguracionServicio',
                            '20261016070000_AgregarUnidadOrganizativaAOrdenTrabajo',
                            '20261016223100_AgregarAlmacenPadreAAlmacenes',
                            '20261017203223_AgregarDevolucionProveedorYRespaldo',
                            '20261018015057_AgregarMotivosRetiroEquipo'
                        );

                        INSERT INTO public.""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                        VALUES ('20261022040929_InicialServicioCampo', '10.0.11')
                        ON CONFLICT (""MigrationId"") DO NOTHING;
                    END IF;
                END $$;
            ");

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

            // 4. Asegurar tabla de Devoluciones a Proveedor y campo DocumentoRespaldoUrl en Compras
            await servicioCampoDbContext.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE inventario.""Compras"" ADD COLUMN IF NOT EXISTS ""DocumentoRespaldoUrl"" character varying(500);

                CREATE TABLE IF NOT EXISTS inventario.""DevolucionesProveedor"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Numero"" character varying(40) NOT NULL,
                    ""Proveedor"" character varying(150) NOT NULL,
                    ""AlmacenId"" uuid NOT NULL,
                    ""UbicacionId"" uuid NULL,
                    ""TipoDocumento"" character varying(30) NOT NULL,
                    ""NumeroDocumento"" character varying(100) NOT NULL,
                    ""FechaDocumento"" date NOT NULL,
                    ""Motivo"" character varying(200) NOT NULL,
                    ""Observaciones"" character varying(500) NULL,
                    ""DocumentoRespaldoUrl"" character varying(500) NULL,
                    ""LineasJson"" text NOT NULL DEFAULT '[]',
                    ""TotalItems"" integer NOT NULL DEFAULT 0,
                    ""TotalCantidad"" numeric(18,5) NOT NULL DEFAULT 0,
                    ""Estado"" character varying(50) NOT NULL DEFAULT 'Completada',
                    ""UsuarioId"" uuid NOT NULL,
                    ""UsuarioNombre"" character varying(150) NOT NULL,
                    ""FechaRegistro"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""FechaCompletada"" timestamp with time zone NULL,
                    xmin xid NOT NULL DEFAULT ('0'::xid),
                    CONSTRAINT ""FK_DevolucionesProveedor_Almacenes"" FOREIGN KEY (""AlmacenId"") REFERENCES inventario.""Almacenes"" (""Id"") ON DELETE RESTRICT,
                    CONSTRAINT ""FK_DevolucionesProveedor_Ubicaciones"" FOREIGN KEY (""UbicacionId"") REFERENCES inventario.""UbicacionesInventario"" (""Id"") ON DELETE RESTRICT
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_DevolucionesProveedor_Numero"" ON inventario.""DevolucionesProveedor"" (""Numero"");
                CREATE INDEX IF NOT EXISTS ""IX_DevolucionesProveedor_AlmacenId"" ON inventario.""DevolucionesProveedor"" (""AlmacenId"");
                CREATE INDEX IF NOT EXISTS ""IX_DevolucionesProveedor_Estado"" ON inventario.""DevolucionesProveedor"" (""Estado"");
                CREATE INDEX IF NOT EXISTS ""IX_DevolucionesProveedor_FechaRegistro"" ON inventario.""DevolucionesProveedor"" (""FechaRegistro"");

                CREATE SCHEMA IF NOT EXISTS serviciocampo;
                CREATE TABLE IF NOT EXISTS serviciocampo.""MotivosRetiroEquipo"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Nombre"" character varying(150) NOT NULL,
                    ""TipoRetiro"" character varying(50) NOT NULL,
                    ""Descripcion"" character varying(400) NULL,
                    ""Activo"" boolean NOT NULL DEFAULT true,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""UpdatedAt"" timestamp with time zone NULL
                );
                CREATE INDEX IF NOT EXISTS ""IX_MotivosRetiroEquipo_Nombre"" ON serviciocampo.""MotivosRetiroEquipo"" (""Nombre"");
                CREATE INDEX IF NOT EXISTS ""IX_MotivosRetiroEquipo_TipoRetiro"" ON serviciocampo.""MotivosRetiroEquipo"" (""TipoRetiro"");

                -- Sububicaciones jerárquicas y naturaleza (Disponible vs Devolución)
                ALTER TABLE inventario.""UbicacionesInventario"" ADD COLUMN IF NOT EXISTS ""TipoUbicacion"" character varying(30) NOT NULL DEFAULT 'Disponible';
                ALTER TABLE inventario.""UbicacionesInventario"" ADD COLUMN IF NOT EXISTS ""UbicacionPadreId"" uuid NULL;
                CREATE INDEX IF NOT EXISTS ""IX_UbicacionesInventario_TipoUbicacion"" ON inventario.""UbicacionesInventario"" (""AlmacenId"", ""TipoUbicacion"");
                UPDATE inventario.""UbicacionesInventario""
                SET ""TipoUbicacion"" = 'Devolucion'
                WHERE ""Codigo"" = 'DEVOLUCION' OR LOWER(""Nombre"") LIKE '%devoluci%';
            ");
        }
    }
}
