using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes;

public static class InventarioSaldos
{
    public static async Task<StockAlmacen> ObtenerAsync(IServicioCampoDbContext db, Guid ubicacionId, Guid productoId, CondicionInventario condicion, CancellationToken ct)
    {
        var stock = db.StocksAlmacen.Local.FirstOrDefault(x => x.UbicacionId == ubicacionId && x.ProductoId == productoId && x.Condicion == condicion)
            ?? await db.StocksAlmacen.FirstOrDefaultAsync(x => x.UbicacionId == ubicacionId && x.ProductoId == productoId && x.Condicion == condicion, ct);
        if (stock != null) return stock;
        stock = StockAlmacen.Crear(ubicacionId, productoId, condicion: condicion);
        db.StocksAlmacen.Add(stock);
        return stock;
    }
}
