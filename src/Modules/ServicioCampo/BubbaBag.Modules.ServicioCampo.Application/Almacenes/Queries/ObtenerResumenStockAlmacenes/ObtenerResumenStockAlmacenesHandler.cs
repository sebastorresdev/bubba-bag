using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerResumenStockAlmacenes;

public record ObtenerResumenStockAlmacenesQuery(
    bool? SoloActivos = true
) : IQuery<Result<List<ResumenStockAlmacenDto>>>;

public class ObtenerResumenStockAlmacenesHandler : IQueryHandler<ObtenerResumenStockAlmacenesQuery, Result<List<ResumenStockAlmacenDto>>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _user;

    public ObtenerResumenStockAlmacenesHandler(IServicioCampoDbContext context, ICurrentUser user)
    {
        _context = context; _user = user;
    }

    public async Task<Result<List<ResumenStockAlmacenDto>>> HandleAsync(
        ObtenerResumenStockAlmacenesQuery query,
        CancellationToken cancellationToken = default)
    {
        var almacenesQuery = _context.Almacenes.AsNoTracking().Where(a=>InventarioAcceso.AlmacenesConsultables(_context,_user).Contains(a.Id));
        if (query.SoloActivos.HasValue)
            almacenesQuery = almacenesQuery.Where(a => a.Activo == query.SoloActivos.Value);

        var almacenes = await almacenesQuery
            .OrderBy(a => a.Nombre)
            .Select(a => new { a.Id, a.Nombre, a.Activo })
            .ToListAsync(cancellationToken);
        var almacenIds = almacenes.Select(a => a.Id).ToList();

        var stocks = await _context.StocksAlmacen
            .AsNoTracking()
            .Where(s => almacenIds.Contains(s.Ubicacion.AlmacenId))
            .GroupBy(s => s.Ubicacion.AlmacenId)
            .Select(g => new
            {
                AlmacenId = g.Key,
                TotalProductos = g.Select(s=>s.ProductoId).Distinct().Count(),
                TotalUnidades = g.Sum(s => s.CantidadDisponible + s.CantidadReservada)
            })
            .ToDictionaryAsync(x => x.AlmacenId, cancellationToken);

        var series = await _context.ItemsSeriados
            .AsNoTracking()
            .Where(i => i.UbicacionActual != null && almacenIds.Contains(i.UbicacionActual.AlmacenId))
            .GroupBy(i => i.UbicacionActual!.AlmacenId)
            .Select(g => new { AlmacenId = g.Key, TotalSeries = g.Count() })
            .ToDictionaryAsync(x => x.AlmacenId, cancellationToken);

        var resumen = almacenes.Select(a =>
        {
            stocks.TryGetValue(a.Id, out var stock);
            series.TryGetValue(a.Id, out var seriesEnAlmacen);
            return new ResumenStockAlmacenDto(
                a.Id,
                a.Nombre,
                a.Activo,
                stock?.TotalProductos ?? 0,
                stock?.TotalUnidades ?? 0m,
                seriesEnAlmacen?.TotalSeries ?? 0
            );
        }).ToList();

        return Result<List<ResumenStockAlmacenDto>>.Success(resumen);
    }
}
