using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Inventario.Domain.Productos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Inventario.Application;

public interface IInventarioDbContext
{
    DbSet<Producto> Productos { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
