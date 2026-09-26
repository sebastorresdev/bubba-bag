using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerListasPrecios;

public record ObtenerListasPreciosQuery(
    string? Search = null,
    bool? SoloActivos = null
) : IQuery<Result<List<ListaPreciosDto>>>;

public class ObtenerListasPreciosHandler : IQueryHandler<ObtenerListasPreciosQuery, Result<List<ListaPreciosDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerListasPreciosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ListaPreciosDto>>> HandleAsync(ObtenerListasPreciosQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.ListasPrecios.AsNoTracking().AsQueryable();

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(l => l.Activo == query.SoloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(l =>
                l.Codigo.ToLower().Contains(search) ||
                l.Nombre.ToLower().Contains(search) ||
                (l.Descripcion != null && l.Descripcion.ToLower().Contains(search)));
        }

        var list = await dbQuery
            .OrderBy(l => l.Nombre)
            .Select(l => new ListaPreciosDto(
                l.Id,
                l.Codigo,
                l.Nombre,
                l.Moneda,
                l.Descripcion,
                l.FechaInicio,
                l.FechaFin,
                l.Activo,
                l.Elementos.Count()
            ))
            .ToListAsync(cancellationToken);

        return Result<List<ListaPreciosDto>>.Success(list);
    }
}
