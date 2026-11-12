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

        // Asegurar columna SupervisorId en seguridad."AspNetUsers"
        try
        {
            await seguridadDbContext.Database.ExecuteSqlRawAsync(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'seguridad' 
                          AND table_name = 'AspNetUsers' 
                          AND column_name = 'SupervisorId'
                    ) THEN
                        ALTER TABLE seguridad.""AspNetUsers"" 
                        ADD COLUMN ""SupervisorId"" uuid NULL 
                        REFERENCES seguridad.""AspNetUsers""(""Id"") ON DELETE SET NULL;
                        
                        CREATE INDEX IF NOT EXISTS ""IX_AspNetUsers_SupervisorId"" 
                        ON seguridad.""AspNetUsers"" (""SupervisorId"");
                    END IF;
                END $$;
            ");
        }
        catch { }


        var rrhhDbContext = scope.ServiceProvider.GetRequiredService<RecursosHumanosDbContext>();
        try
        {
            await rrhhDbContext.Database.MigrateAsync();
        }
        catch { }

        // Asegurar tablas de Horarios, Turnos y Marcaciones de Asistencia en esquema rrhh
        try
        {
            await rrhhDbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS rrhh.""Turnos"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Codigo"" varchar(30) NOT NULL,
                    ""Nombre"" varchar(100) NOT NULL,
                    ""HoraInicio"" time NOT NULL,
                    ""HoraFin"" time NOT NULL,
                    ""CruzaMedianoche"" boolean NOT NULL DEFAULT false,
                    ""MinutosRefrigerio"" integer NOT NULL DEFAULT 60,
                    ""MinutosToleranciaEntrada"" integer NOT NULL DEFAULT 15,
                    ""MinutosToleranciaRefrigerio"" integer NOT NULL DEFAULT 5,
                    ""VentanaEntradaInicio"" time NOT NULL,
                    ""VentanaEntradaFin"" time NOT NULL,
                    ""VentanaSalidaInicio"" time NOT NULL,
                    ""VentanaSalidaFin"" time NOT NULL,
                    ""Activo"" boolean NOT NULL DEFAULT true
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Turnos_Codigo"" ON rrhh.""Turnos"" (""Codigo"");

                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'rrhh' AND table_name = 'Empleados' AND column_name = 'TurnoId'
                    ) THEN
                        ALTER TABLE rrhh.""Empleados"" 
                        ADD COLUMN ""TurnoId"" uuid NULL 
                        REFERENCES rrhh.""Turnos""(""Id"") ON DELETE SET NULL;

                        CREATE INDEX IF NOT EXISTS ""IX_Empleados_TurnoId"" ON rrhh.""Empleados"" (""TurnoId"");
                    END IF;
                END $$;

                CREATE TABLE IF NOT EXISTS rrhh.""PlantillasSemanales"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""EmpleadoId"" uuid NOT NULL REFERENCES rrhh.""Empleados""(""Id"") ON DELETE CASCADE,
                    ""DiaSemana"" integer NOT NULL,
                    ""TurnoId"" uuid NULL REFERENCES rrhh.""Turnos""(""Id"") ON DELETE SET NULL,
                    ""EsDescanso"" boolean NOT NULL DEFAULT false
                );

                CREATE TABLE IF NOT EXISTS rrhh.""Marcaciones"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""EmpleadoId"" uuid NOT NULL REFERENCES rrhh.""Empleados""(""Id"") ON DELETE CASCADE,
                    ""FechaHora"" timestamptz NOT NULL,
                    ""DispositivoMarcacionId"" uuid NULL,
                    ""LugarMarcacionId"" uuid NULL,
                    ""TipoMarca"" integer NOT NULL,
                    ""Origen"" integer NOT NULL DEFAULT 2,
                    ""MetodoAutenticacion"" integer NOT NULL DEFAULT 1,
                    ""FotoUrl"" text NULL,
                    ""Latitud"" double precision NULL,
                    ""Longitud"" double precision NULL,
                    ""EsValida"" boolean NOT NULL DEFAULT true,
                    ""ObservacionDescarte"" varchar(250) NULL,
                    ""Procesado"" boolean NOT NULL DEFAULT false
                );

                CREATE INDEX IF NOT EXISTS ""IX_Marcaciones_EmpleadoId_FechaHora"" ON rrhh.""Marcaciones"" (""EmpleadoId"", ""FechaHora"");

                CREATE TABLE IF NOT EXISTS rrhh.""AsistenciasDiarias"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""EmpleadoId"" uuid NOT NULL REFERENCES rrhh.""Empleados""(""Id"") ON DELETE CASCADE,
                    ""FechaOperativa"" date NOT NULL,
                    ""TurnoId"" uuid NULL REFERENCES rrhh.""Turnos""(""Id"") ON DELETE SET NULL,
                    ""HoraEntradaProgramada"" timestamp NULL,
                    ""HoraSalidaProgramada"" timestamp NULL,
                    ""HoraEntradaReal"" timestamptz NULL,
                    ""HoraSalidaReal"" timestamptz NULL,
                    ""HoraInicioRefrigerioReal"" timestamptz NULL,
                    ""HoraFinRefrigerioReal"" timestamptz NULL,
                    ""MinutosTardanza"" integer NOT NULL DEFAULT 0,
                    ""MinutosSalidaTemprana"" integer NOT NULL DEFAULT 0,
                    ""MinutosExcesoRefrigerio"" integer NOT NULL DEFAULT 0,
                    ""HorasTrabajadas"" numeric(18,2) NOT NULL DEFAULT 0,
                    ""HorasDiurnas"" numeric(18,2) NOT NULL DEFAULT 0,
                    ""HorasNocturnas"" numeric(18,2) NOT NULL DEFAULT 0,
                    ""MinutosHorasExtra"" integer NOT NULL DEFAULT 0,
                    ""HorasExtraAprobadas"" boolean NOT NULL DEFAULT false,
                    ""Estado"" integer NOT NULL DEFAULT 1,
                    ""Aprobado"" boolean NOT NULL DEFAULT false,
                    ""EsGeneradoAutomaticamente"" boolean NOT NULL DEFAULT false,
                    ""Observacion"" varchar(500) NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_AsistenciasDiarias_EmpleadoId_FechaOperativa"" 
                ON rrhh.""AsistenciasDiarias"" (""EmpleadoId"", ""FechaOperativa"");

                -- Insertar turnos estándar predeterminados si la tabla está vacía
                INSERT INTO rrhh.""Turnos"" (
                    ""Id"", ""Codigo"", ""Nombre"", ""HoraInicio"", ""HoraFin"", ""CruzaMedianoche"",
                    ""MinutosRefrigerio"", ""MinutosToleranciaEntrada"", ""MinutosToleranciaRefrigerio"",
                    ""VentanaEntradaInicio"", ""VentanaEntradaFin"", ""VentanaSalidaInicio"", ""VentanaSalidaFin"", ""Activo""
                )
                SELECT 
                    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'T-ADM-01', 'Administrativo (08:00 - 17:00)',
                    '08:00:00'::time, '17:00:00'::time, false, 60, 15, 5,
                    '06:00:00'::time, '10:00:00'::time, '15:00:00'::time, '21:00:00'::time, true
                WHERE NOT EXISTS (SELECT 1 FROM rrhh.""Turnos"" WHERE ""Codigo"" = 'T-ADM-01');

                INSERT INTO rrhh.""Turnos"" (
                    ""Id"", ""Codigo"", ""Nombre"", ""HoraInicio"", ""HoraFin"", ""CruzaMedianoche"",
                    ""MinutosRefrigerio"", ""MinutosToleranciaEntrada"", ""MinutosToleranciaRefrigerio"",
                    ""VentanaEntradaInicio"", ""VentanaEntradaFin"", ""VentanaSalidaInicio"", ""VentanaSalidaFin"", ""Activo""
                )
                SELECT 
                    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'T-CAMPO-01', 'Técnicos de Campo (07:30 - 16:30)',
                    '07:30:00'::time, '16:30:00'::time, false, 60, 15, 5,
                    '05:30:00'::time, '09:30:00'::time, '14:30:00'::time, '20:30:00'::time, true
                WHERE NOT EXISTS (SELECT 1 FROM rrhh.""Turnos"" WHERE ""Codigo"" = 'T-CAMPO-01');
            ");
        }
        catch { }

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

            // Asegurar columna y relación TipoOrdenId en serviciocampo.PlantillasTrabajo
            try
            {
                await servicioCampoDbContext.Database.ExecuteSqlRawAsync(@"
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_schema = 'serviciocampo' 
                              AND table_name = 'PlantillasTrabajo' 
                              AND column_name = 'TipoOrdenId'
                        ) THEN
                            ALTER TABLE serviciocampo.""PlantillasTrabajo"" 
                            ADD COLUMN ""TipoOrdenId"" uuid NULL 
                            REFERENCES serviciocampo.""TiposOrdenTrabajo""(""Id"") ON DELETE SET NULL;
                            
                            CREATE INDEX IF NOT EXISTS ""IX_PlantillasTrabajo_TipoOrdenId"" 
                            ON serviciocampo.""PlantillasTrabajo"" (""TipoOrdenId"");
                        END IF;
                    END $$;
                ");
            }
            catch { }
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
