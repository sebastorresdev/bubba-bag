using System;
using System.Threading.Tasks;
using BubbaBag.Modules.Ventas.Domain.ListasPrecio;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.Ventas.Infrastructure.Database.Seeders;

public static class VentasSeeder
{
    public static async Task SeedAsync(VentasDbContext context, ILogger logger)
    {
        if (await context.ListasPrecio.AnyAsync())
        {
            return;
        }

        logger.LogInformation("Sembrando listas de precios comerciales iniciales...");

        var listaEstandar = ListaPrecio.Crear(
            "Tarifa General Base 2026",
            "PEN",
            "Lista de precios estándar para servicios y productos generales",
            DateTime.UtcNow.Date,
            DateTime.UtcNow.Date.AddYears(2),
            true
        );

        var listaDirectv = ListaPrecio.Crear(
            "Tarifa Corporativa DIRECTV",
            "PEN",
            "Tarifas pactadas para operaciones satelitales DTH y FTTH",
            DateTime.UtcNow.Date,
            DateTime.UtcNow.Date.AddYears(1),
            false
        );

        await context.ListasPrecio.AddRangeAsync(listaEstandar, listaDirectv);
        await context.SaveChangesAsync();

        logger.LogInformation("Listas de precios sembradas exitosamente.");
    }
}
