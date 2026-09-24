using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerCategoriasProducto;

public record ObtenerCategoriasProductoQuery(
    string? Search = null,
    bool? SoloActivos = null
) : IQuery<Result<List<CategoriaProductoDto>>>;

public class ObtenerCategoriasProductoHandler : IQueryHandler<ObtenerCategoriasProductoQuery, Result<List<CategoriaProductoDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerCategoriasProductoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<CategoriaProductoDto>>> HandleAsync(ObtenerCategoriasProductoQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.CategoriasProducto.AsNoTracking().AsQueryable();

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(c => c.Activo == query.SoloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(c =>
                c.Nombre.ToLower().Contains(search) ||
                (c.Familia != null && c.Familia.ToLower().Contains(search)) ||
                (c.Descripcion != null && c.Descripcion.ToLower().Contains(search)));
        }

        var list = await dbQuery
            .OrderBy(c => c.Nombre)
            .Select(c => new CategoriaProductoDto(
                c.Id,
                c.Nombre,
                c.Familia,
                c.Descripcion,
                c.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<List<CategoriaProductoDto>>.Success(list);
    }
}
