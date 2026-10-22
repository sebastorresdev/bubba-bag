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

                // 1. Asegurar y normalizar ubicación DISPONIBLE (nombre limpio "Disponible")
                var disponible = ubicaciones.FirstOrDefault(u => u.Codigo == "DISPONIBLE" || u.Nombre.ToLower() == "disponible")
                                ?? ubicaciones.FirstOrDefault(u => u.EsPrincipal || u.Codigo == "PRINCIPAL" || u.Nombre.ToLower() == "principal" || u.Nombre.ToLower().Contains("stock"));
                if (disponible == null)
                {
                    context.UbicacionesInventario.Add(BubbaBag.Modules.ServicioCampo.Domain.Almacenes.UbicacionInventario.Crear(alm.Id, "DISPONIBLE", "Disponible", principal: true, tipoUbicacion: BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Disponible));
                    huboCambios = true;
                }
                else
                {
                    if (disponible.Nombre != "Disponible" || disponible.Codigo != "DISPONIBLE" || !disponible.EsPrincipal)
                    {
                        disponible.NormalizarPredeterminada("DISPONIBLE", "Disponible", BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Disponible, true);
                        huboCambios = true;
                    }
                }

                // 2. Asegurar y normalizar ubicación DEVOLUCION (nombre limpio "Devolución", sin "Recuperados")
                var devolucion = ubicaciones.FirstOrDefault(u => u.Codigo == "DEVOLUCION" || u.Nombre.ToLower().Contains("devoluci"));
                if (devolucion == null)
                {
                    context.UbicacionesInventario.Add(BubbaBag.Modules.ServicioCampo.Domain.Almacenes.UbicacionInventario.Crear(alm.Id, "DEVOLUCION", "Devolución", principal: false, tipoUbicacion: BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Devolucion));
                    huboCambios = true;
                }
                else
                {
                    if (devolucion.Nombre != "Devolución" || devolucion.Codigo != "DEVOLUCION")
                    {
                        devolucion.NormalizarPredeterminada("DEVOLUCION", "Devolución", BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Devolucion, false);
                        huboCambios = true;
                    }
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
        // Catálogo de motivos de retiro gestionado por el usuario (sin datos de prueba)
        return;
    }
}
