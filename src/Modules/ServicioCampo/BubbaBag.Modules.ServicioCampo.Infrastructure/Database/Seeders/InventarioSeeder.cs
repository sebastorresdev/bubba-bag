using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class InventarioSeeder
{
    public static async Task SeedAsync(ServicioCampoDbContext context, ILogger logger, Dictionary<string, Guid>? sucursalesMap = null)
    {
        if (sucursalesMap != null && sucursalesMap.Count > 0)
        {
            await SeedAlmacenesAsync(context, sucursalesMap, logger);
        }
    }

    private static async Task SeedProductosAsync(ServicioCampoDbContext context, ILogger logger)
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

    private static async Task SeedAlmacenesAsync(ServicioCampoDbContext context, Dictionary<string, Guid> sucursalesMap, ILogger logger)
    {
        var almacenesBase = new List<(string Codigo, string Nombre, string CodigoSucursal, string Direccion, string? Encargado)>
        {
            ("ALM-BASE-LIM", "Almacén Central Lima", "LIMA", "Av. Javier Prado Este 444, San Isidro", "Almacenero Lima"),
            ("ALM-BASE-ANC-HZ", "Almacén Base Huaraz", "ANCASH", "Av. Luzuriaga 450, Huaraz", "Almacenero Huaraz"),
            ("ALM-BASE-ANC-CH", "Almacén Base Chimbote", "ANCASH", "Av. Bolognesi 120, Chimbote", "Almacenero Chimbote"),
            ("ALM-BASE-PIU", "Almacén Base Piura", "PIURA", "Av. Grau 430, Piura", "Almacenero Piura"),
            ("ALM-BASE-CHX", "Almacén Base Chiclayo", "CHICLAYO", "Av. José Balta 850, Chiclayo", "Almacenero Chiclayo"),
            ("ALM-BASE-TRU", "Almacén Base Trujillo", "TRUJILLO", "Av. España 1120, Trujillo", "Almacenero Trujillo")
        };

        bool huboCambios = false;
        foreach (var alm in almacenesBase)
        {
            if (!sucursalesMap.TryGetValue(alm.CodigoSucursal, out var sucursalId))
            {
                continue;
            }

            if (!await context.Almacenes.AnyAsync(a => a.Codigo == alm.Codigo))
            {
                var nuevoAlmacen = Almacen.CrearFisico(
                    alm.Codigo,
                    alm.Nombre,
                    sucursalId,
                    alm.Direccion,
                    telefono: null);

                await context.Almacenes.AddAsync(nuevoAlmacen);
                huboCambios = true;
            }
        }

        if (huboCambios)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Almacenes físicos base sembrados exitosamente.");
        }
    }

    private static async Task SeedStockYSeriadosAsync(ServicioCampoDbContext context, ILogger logger)
    {
        var almacenes = await context.Almacenes.ToListAsync();
        var productos = await context.Productos.ToListAsync();

        if (!almacenes.Any() || !productos.Any())
        {
            return;
        }

        var almHuaraz = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-ANC-HZ");
        var almPiura = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-PIU");
        var almLima = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-LIM");

        var prodCable = productos.FirstOrDefault(p => p.Codigo == "CBL-RG6");
        var prodConector = productos.FirstOrDefault(p => p.Codigo == "CON-RG6");
        var prodSplitter = productos.FirstOrDefault(p => p.Codigo == "SPL-2W");
        var prodDecoHD = productos.FirstOrDefault(p => p.Codigo == "EQ-DEC-HD");
        var prodDeco4K = productos.FirstOrDefault(p => p.Codigo == "EQ-DEC-4K");
        var prodRouter = productos.FirstOrDefault(p => p.Codigo == "EQ-RTR-WF");

        bool huboCambios = false;

        // 1. Sembrar saldo de stock de insumos a granel
        if (prodCable != null && prodConector != null && prodSplitter != null)
        {
            var stocksIniciales = new (Almacen? Alm, Producto Prod, decimal Cantidad)[]
            {
                (almHuaraz, prodCable, 1200m),
                (almHuaraz, prodConector, 600m),
                (almHuaraz, prodSplitter, 150m),
                (almPiura, prodCable, 1500m),
                (almPiura, prodConector, 800m),
                (almPiura, prodSplitter, 200m),
                (almLima, prodCable, 5000m),
                (almLima, prodConector, 2500m),
                (almLima, prodSplitter, 600m)
            };

            foreach (var (alm, prod, cant) in stocksIniciales)
            {
                if (alm == null) continue;

                if (!await context.StocksAlmacen.AnyAsync(s => s.AlmacenId == alm.Id && s.ProductoId == prod.Id))
                {
                    var stock = StockAlmacen.Crear(alm.Id, prod.Id, cant);
                    await context.StocksAlmacen.AddAsync(stock);

                    // Registrar movimiento inicial de Kardex
                    var mov = MovimientoInventario.Registrar(
                        TipoMovimientoInventario.IngresoProveedor,
                        prod.Id,
                        cant,
                        almacenOrigenId: null,
                        almacenDestinoId: alm.Id,
                        numeroDocumento: "INVENTARIO-INICIAL",
                        observaciones: "Saldo inicial de inventario");
                    await context.MovimientosInventario.AddAsync(mov);

                    huboCambios = true;
                }
            }
        }

        // 2. Sembrar decodificadores y equipos seriados
        if (almHuaraz != null && prodDecoHD != null && prodDeco4K != null && prodRouter != null)
        {
            var seriadosIniciales = new (Producto Prod, string Serie, string? SmartCard, string? Mac, Almacen Alm)[]
            {
                (prodDecoHD, "0284719280", "0019283740", null, almHuaraz),
                (prodDecoHD, "0284719281", "0019283741", null, almHuaraz),
                (prodDecoHD, "0284719282", "0019283742", null, almHuaraz),
                (prodDeco4K, "0484719290", "0019283790", null, almHuaraz),
                (prodDeco4K, "0484719291", "0019283791", null, almHuaraz),
                (prodRouter, "RT-WF-9901", null, "A4:C3:F0:12:34:01", almHuaraz),
                (prodRouter, "RT-WF-9902", null, "A4:C3:F0:12:34:02", almHuaraz)
            };

            foreach (var s in seriadosIniciales)
            {
                if (!await context.ItemsSeriados.AnyAsync(i => i.NumeroSerie == s.Serie))
                {
                    var item = ItemSeriado.Crear(
                        s.Prod.Id,
                        s.Serie,
                        s.Alm.Id,
                        s.SmartCard,
                        s.Mac,
                        "Cargado en stock inicial de bodega base");

                    await context.ItemsSeriados.AddAsync(item);

                    var mov = MovimientoInventario.Registrar(
                        TipoMovimientoInventario.IngresoProveedor,
                        s.Prod.Id,
                        1m,
                        almacenOrigenId: null,
                        almacenDestinoId: s.Alm.Id,
                        itemSeriadoId: item.Id,
                        numeroDocumento: "INVENTARIO-INICIAL-SERIADO",
                        observaciones: $"Ingreso inicial de equipo serie {s.Serie}");
                    await context.MovimientosInventario.AddAsync(mov);

                    huboCambios = true;
                }
            }
        }

        if (huboCambios)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Stock de insumos y equipos seriados sembrados exitosamente.");
        }
    }
}

