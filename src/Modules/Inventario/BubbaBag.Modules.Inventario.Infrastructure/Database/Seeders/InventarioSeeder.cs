using System.Threading.Tasks;
using BubbaBag.Modules.Inventario.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.Inventario.Infrastructure.Database.Seeders;

public static class InventarioSeeder
{
    public static async Task SeedAsync(InventarioDbContext context, ILogger logger)
    {
        if (await context.Productos.AnyAsync())
        {
            return;
        }

        logger.LogInformation("Sembrando catálogo base de productos de inventario...");

        var productos = new[]
        {
            // Insumos y Materiales
            Producto.Crear("CBL-RG6", "Cable Coaxial RG6 Negro", "Materiales", "Metros", false, "Cable coaxial RG6 estándar para televisión satelital y cable"),
            Producto.Crear("CON-RG6", "Conector F de Compresión RG6", "Materiales", "Unidades", false, "Conector metálico de compresión para terminación coaxial"),
            Producto.Crear("GRP-CAB", "Grapas para Cable Coaxial (Bolsa x100)", "Materiales", "Bolsas", false, "Grapas plásticas con clavo para fijación en pared"),
            Producto.Crear("SPL-2W", "Splitter Divisor de 2 Vías 5-2400MHz", "Materiales", "Unidades", false, "Divisor pasivo de señal para dos receptores"),
            Producto.Crear("CBL-UTP5E", "Cable de Red UTP Cat 5E", "Materiales", "Metros", false, "Cable de red para conexión de datos y decodificadores Smart"),
            Producto.Crear("CON-RJ45", "Conector RJ45 Macho Cat 5E/6", "Materiales", "Unidades", false, "Conector para terminación de red"),
            Producto.Crear("CJA-EMB-01", "Caja de Cartón para Encomiendas Mediana", "Insumos", "Unidades", false, "Caja para empaque y despacho de equipos"),
            Producto.Crear("CIN-EMB-01", "Cinta de Embalaje Transparente 2x100m", "Insumos", "Rollos", false, "Cinta adhesiva para sellado de encomiendas"),

            // Equipos (Serializados)
            Producto.Crear("EQ-DEC-HD", "Decodificador DIRECTV HD", "Equipos", "Unidades", true, "Receptor satelital alta definición con tarjeta integrada"),
            Producto.Crear("EQ-DEC-4K", "Decodificador DIRECTV 4K UHD", "Equipos", "Unidades", true, "Receptor satelital 4K ultra alta definición"),
            Producto.Crear("EQ-RTR-WF", "Router Inalámbrico WiFi Dual Band", "Equipos", "Unidades", true, "Enrutador inalámbrico para conexión de internet y streaming"),
            Producto.Crear("EQ-ANT-60", "Antena Parabólica 60cm con Soporte", "Equipos", "Unidades", false, "Plato satelital con LNB y kit de fijación a muro"),
            Producto.Crear("ACC-CTR-01", "Control Remoto Universal DIRECTV", "Equipos", "Unidades", false, "Control remoto infrarrojo de reemplazo"),
        };

        await context.Productos.AddRangeAsync(productos);
        await context.SaveChangesAsync();
        logger.LogInformation("Catálogo de productos sembrado exitosamente ({Cantidad} artículos).", productos.Length);
    }
}
