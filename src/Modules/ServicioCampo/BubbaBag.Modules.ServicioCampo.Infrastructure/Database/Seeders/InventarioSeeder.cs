using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class InventarioSeeder
{
    public static async Task SeedAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null,
        Dictionary<string, Guid>? sucursalesMap = null)
    {
        await AsegurarUnidadesMedidaAsync(context, logger);
        await AsegurarUbicacionesPredeterminadasAsync(context, logger);
        await AsegurarMotivosRetiroEquipoAsync(context, logger);
    }

    public static async Task AsegurarUnidadesMedidaAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null)
    {
        try
        {
            var existeGrupo = await context.GruposUnidadMedida
                .AnyAsync(g => g.Nombre.ToLower() == "unidades generales");

            if (!existeGrupo)
            {
                var (grupo, _) = GrupoUnidadMedida.Crear("Unidades Generales", "Unidades");
                await context.GruposUnidadMedida.AddAsync(grupo);
                await context.SaveChangesAsync();
                logger?.LogInformation("Grupo de unidad de medida predeterminado 'Unidades Generales' con unidad base 'Unidades' creado exitosamente.");
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "No se pudo sembrar el grupo de unidades de medida predeterminado.");
        }
    }

    public static async Task AsegurarUbicacionesPredeterminadasAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null)
    {
        try
        {
            var almacenes = await context.Almacenes.ToListAsync();
            bool huboCambios = false;

            foreach (var alm in almacenes)
            {
                var ubicaciones = await context.UbicacionesInventario
                    .Where(u => u.AlmacenId == alm.Id)
                    .ToListAsync();

                // 1. Asegurar ubicación de Disponibles / Principal
                var principal = ubicaciones.FirstOrDefault(u => u.EsPrincipal) ?? ubicaciones.FirstOrDefault();
                if (principal == null)
                {
                    context.UbicacionesInventario.Add(BubbaBag.Modules.ServicioCampo.Domain.Almacenes.UbicacionInventario.Crear(alm.Id, "DISPONIBLE", "Disponible / Stock", principal: true, tipoUbicacion: BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Disponible));
                    huboCambios = true;
                }

                // 2. Asegurar ubicación de Devoluciones / Recuperados
                var devolucion = ubicaciones.FirstOrDefault(u => u.Codigo == "DEVOLUCION" || u.Nombre.ToLower().Contains("devoluci"));
                if (devolucion == null)
                {
                    context.UbicacionesInventario.Add(BubbaBag.Modules.ServicioCampo.Domain.Almacenes.UbicacionInventario.Crear(alm.Id, "DEVOLUCION", "Devolución / Recuperados", principal: false, tipoUbicacion: BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Devolucion));
                    huboCambios = true;
                }
            }

            if (huboCambios)
            {
                await context.SaveChangesAsync();
                logger?.LogInformation("Ubicaciones predeterminadas (Disponible y Devolución) aseguradas para todos los almacenes.");
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "No se pudieron asegurar las ubicaciones predeterminadas en los almacenes.");
        }
    }

    public static async Task AsegurarMotivosRetiroEquipoAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null)
    {
        try
        {
            if (await context.MotivosRetiroEquipo.AnyAsync()) return;

            var motivosDefault = new[]
            {
                // 1. Avería Técnica
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "No Enciende / Fuente Quemada",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.AveriaTecnica,
                    "Equipo no enciende o presenta corte eléctrico en transformador/fuente."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Falla de Disco Duro",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.AveriaTecnica,
                    "Error de lectura/escritura, disco no detectado o reinicios continuos."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Problema de Sintonizador / Tuner",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.AveriaTecnica,
                    "Sintonizador no detecta señal satelital o no escanea transponders."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Tarjeta SmartCard / Lector Dañado",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.AveriaTecnica,
                    "Lector no reconoce chip o tarjeta SmartCard dañada físicamente."),

                // 2. Cambio de Tecnología (Upgrade / Downgrade)
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Cambio a Deco 4K / Android TV (Upgrade)",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.CambioTecnologia,
                    "Equipo estándar retirado 100% operativo por migración del abonado a tecnología superior."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Devolución de Deco Adicional (Downgrade)",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.CambioTecnologia,
                    "Equipo adicional devuelto 100% operativo por reducción voluntaria de puntos contratados."),

                // 3. Baja Comercial
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Cancelación Voluntaria de Contrato",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.BajaComercial,
                    "Retiro de equipo operativo por término o rescisión de contrato del abonado."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Corte Definitivo por Morosidad",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.BajaComercial,
                    "Recuperación de equipo operativo por falta reiterada de pago."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Mudanza a Zona sin Cobertura",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.BajaComercial,
                    "Equipo retirado en óptimo estado por traslado del cliente a localidad sin servicio."),

                // 4. Daño Físico o Siniestro
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Descarga Eléctrica / Rayo en Tormenta",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.DanoSiniestro,
                    "Sobretensión de red o impacto de rayo en antena exterior. Daño no imputable a garantía."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Golpe Severo / Carcasa Quebrada",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.DanoSiniestro,
                    "Daño físico mecánico imputable a caída o golpe severo en domicilio del abonado."),
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Derrame de Líquidos / Humedad",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.DanoSiniestro,
                    "Corrosión o sulfato por ingreso de agua o líquidos en la placa madre."),

                // 5. Falla de Fábrica / DOA
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Falla en Primera Instalación (DOA)",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.DefectoFabricaDOA,
                    "Equipo nuevo de caja que presentó falla inmediata al instalar. Aplica cambio directo con proveedor."),

                // 6. Fin de Vida Útil / Obsolescencia
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Baja Masiva de Tecnología Obsoleta (SD / MPEG-2)",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.ObsolescenciaEOL,
                    "Retiro de modelos descontinuados para disposición final de residuos electrónicos (e-waste)."),

                // 7. Retiro Preventivo / Descarte
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Reemplazo Preventivo por Señal Intermitente",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.PreventivoDescarte,
                    "Cambio por descarte en visita técnica para descartar hardware (pendiente de validación en laboratorio)."),

                // 8. Administrativo / Auditoría
                BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.MotivoRetiroEquipo.Crear(
                    "Retención por Auditoría / Serie Duplicada",
                    BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos.TipoRetiroEquipo.AdministrativoAuditoria,
                    "Equipo retenido por orden de control interno, discrepancia serial o investigación de clonación.")
            };

            await context.MotivosRetiroEquipo.AddRangeAsync(motivosDefault);
            await context.SaveChangesAsync();
            logger?.LogInformation("Catálogo universal de Motivos de Retiro de Equipos sembrado exitosamente.");
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "No se pudo sembrar el catálogo de motivos de retiro de equipos.");
        }
    }
}
