using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Ventas.Domain.ListasPrecio;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Ventas.Application;

public interface IVentasDbContext
{
    DbSet<ListaPrecio> ListasPrecio { get; }
    DbSet<ListaPrecioItem> ListasPrecioItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
