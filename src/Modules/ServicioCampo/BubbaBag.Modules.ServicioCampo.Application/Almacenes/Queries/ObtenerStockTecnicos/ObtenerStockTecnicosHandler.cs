using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerStockTecnicos;

public record ObtenerStockTecnicosQuery(
    bool? SoloActivos = true
) : IQuery<Result<List<ResumenAlmacenMovilDto>>>;

public class ObtenerStockTecnicosHandler : IQueryHandler<ObtenerStockTecnicosQuery, Result<List<ResumenAlmacenMovilDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerStockTecnicosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ResumenAlmacenMovilDto>>> HandleAsync(
        ObtenerStockTecnicosQuery query,
        CancellationToken cancellationToken = default)
    {
        // Traer todos los almacenes móviles con su stock
        var almacenesQuery = _context.Almacenes
            .AsNoTracking()
            .Where(a => a.Tipo == TipoAlmacen.Movil);

        if (query.SoloActivos.HasValue)
            almacenesQuery = almacenesQuery.Where(a => a.Activo == query.SoloActivos.Value);

        var almacenes = await almacenesQuery
            .OrderBy(a => a.Nombre)
            .Select(a => new { a.Id, a.Codigo, a.Nombre, a.RecursoTecnicoId, a.Activo })
            .ToListAsync(cancellationToken);

        var almacenIds = almacenes.Select(a => a.Id).ToList();

        // Stock no seriado (cantidades)
        var stocks = await _context.StocksAlmacen
            .AsNoTracking()
            .Where(s => almacenIds.Contains(s.AlmacenId))
            .GroupBy(s => s.AlmacenId)
            .Select(g => new
            {
                AlmacenId = g.Key,
                TotalProductos = g.Count(),
                TotalUnidades = g.Sum(s => s.CantidadDisponible + s.CantidadReservada)
            })
            .ToListAsync(cancellationToken);

        // Series en custodia (seriados)
        var series = await _context.ItemsSeriados
            .AsNoTracking()
            .Where(i => i.AlmacenActualId != null && almacenIds.Contains(i.AlmacenActualId!.Value))
            .GroupBy(i => i.AlmacenActualId!.Value)
            .Select(g => new { AlmacenId = g.Key, TotalSeries = g.Count() })
            .ToListAsync(cancellationToken);

        var resultado = almacenes.Select(a =>
        {
            var stock = stocks.FirstOrDefault(s => s.AlmacenId == a.Id);
            var serie = series.FirstOrDefault(s => s.AlmacenId == a.Id);

            return new ResumenAlmacenMovilDto(
                a.Id,
                a.Codigo,
                a.Nombre,
                a.RecursoTecnicoId,
                a.Activo,
                stock?.TotalProductos ?? 0,
                stock?.TotalUnidades ?? 0m,
                serie?.TotalSeries ?? 0
            );
        }).ToList();

        return Result<List<ResumenAlmacenMovilDto>>.Success(resultado);
    }
}
