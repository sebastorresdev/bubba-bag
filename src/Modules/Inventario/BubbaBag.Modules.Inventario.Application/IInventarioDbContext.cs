using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Inventario.Domain.Almacenes;
using BubbaBag.Modules.Inventario.Domain.Productos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Inventario.Application;

public interface IInventarioDbContext
{
    DbSet<Producto> Productos { get; }
    DbSet<Almacen> Almacenes { get; }
    DbSet<ItemSeriado> ItemsSeriados { get; }
    DbSet<StockAlmacen> StocksAlmacen { get; }
    DbSet<MovimientoInventario> MovimientosInventario { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
