using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerCategoriaProductoPorId;

public record ObtenerCategoriaProductoPorIdQuery(Guid Id) : IQuery<Result<CategoriaProductoDto>>;

public class ObtenerCategoriaProductoPorIdHandler : IQueryHandler<ObtenerCategoriaProductoPorIdQuery, Result<CategoriaProductoDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerCategoriaProductoPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CategoriaProductoDto>> HandleAsync(ObtenerCategoriaProductoPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var c = await _context.CategoriasProducto
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == query.Id, cancellationToken);

        if (c is null)
            return Result<CategoriaProductoDto>.Failure("La categoría no existe.");

        var dto = new CategoriaProductoDto(
            c.Id,
            c.Nombre,
            c.Familia,
            c.Descripcion,
            c.Activo
        );

        return Result<CategoriaProductoDto>.Success(dto);
    }
}
