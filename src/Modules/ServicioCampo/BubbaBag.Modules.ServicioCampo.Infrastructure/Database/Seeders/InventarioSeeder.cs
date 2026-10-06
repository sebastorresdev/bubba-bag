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
}
