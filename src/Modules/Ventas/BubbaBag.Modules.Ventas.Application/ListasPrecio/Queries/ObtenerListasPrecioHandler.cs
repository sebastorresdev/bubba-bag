using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Ventas.Application.ListasPrecio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Ventas.Application.ListasPrecio.Queries;

public record ObtenerListasPrecioQuery(
    string? Search = null,
    bool? SoloActivos = null
) : IQuery<Result<List<ListaPrecioDto>>>;

public class ObtenerListasPrecioHandler : IQueryHandler<ObtenerListasPrecioQuery, Result<List<ListaPrecioDto>>>
{
    private readonly IVentasDbContext _context;

    public ObtenerListasPrecioHandler(IVentasDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ListaPrecioDto>>> HandleAsync(ObtenerListasPrecioQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.ListasPrecio
            .AsNoTracking()
            .Include(lp => lp.Items)
            .AsQueryable();

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(lp => lp.Activo == query.SoloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(lp =>
                lp.Nombre.ToLower().Contains(term) ||
                (lp.Descripcion != null && lp.Descripcion.ToLower().Contains(term)));
        }

        var lista = await dbQuery
            .OrderByDescending(lp => lp.EsPredeterminada)
            .ThenBy(lp => lp.Nombre)
            .Select(lp => new ListaPrecioDto(
                lp.Id,
                lp.Nombre,
                lp.Descripcion,
                lp.Moneda,
                lp.VigenciaDesde,
                lp.VigenciaHasta,
                lp.EsPredeterminada,
                lp.ClienteId,
                lp.Activo,
                lp.Items.Count
            ))
            .ToListAsync(cancellationToken);

        return Result<List<ListaPrecioDto>>.Success(lista);
    }
}
