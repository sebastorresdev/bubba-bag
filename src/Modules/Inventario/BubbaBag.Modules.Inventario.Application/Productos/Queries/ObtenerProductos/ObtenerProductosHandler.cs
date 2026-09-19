using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Inventario.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Inventario.Application.Productos.Queries.ObtenerProductos;

public record ObtenerProductosQuery(
    string? Search = null,
    string? Categoria = null,
    bool? SoloActivos = true
) : IQuery<Result<List<ProductoDto>>>;

public class ObtenerProductosHandler : IQueryHandler<ObtenerProductosQuery, Result<List<ProductoDto>>>
{
    private readonly IInventarioDbContext _context;

    public ObtenerProductosHandler(IInventarioDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ProductoDto>>> HandleAsync(ObtenerProductosQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Productos.AsNoTracking().AsQueryable();

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.Activo == query.SoloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Categoria))
        {
            dbQuery = dbQuery.Where(p => p.Categoria == query.Categoria.Trim());
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(p =>
                p.Codigo.ToLower().Contains(search) ||
                p.Nombre.ToLower().Contains(search) ||
                (p.Descripcion != null && p.Descripcion.ToLower().Contains(search)));
        }

        var lista = await dbQuery
            .OrderBy(p => p.Categoria)
            .ThenBy(p => p.Nombre)
            .Select(p => new ProductoDto(
                p.Id,
                p.Codigo,
                p.Nombre,
                p.Descripcion,
                p.Categoria,
                p.UnidadMedida,
                p.EsSerializado,
                p.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<List<ProductoDto>>.Success(lista);
    }
}
