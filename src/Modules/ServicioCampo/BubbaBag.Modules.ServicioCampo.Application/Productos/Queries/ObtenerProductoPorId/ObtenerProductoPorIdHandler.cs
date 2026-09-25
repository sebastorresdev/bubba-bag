using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerProductoPorId;

public record ObtenerProductoPorIdQuery(Guid Id) : IQuery<Result<ProductoDto>>;

public class ObtenerProductoPorIdHandler : IQueryHandler<ObtenerProductoPorIdQuery, Result<ProductoDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerProductoPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ProductoDto>> HandleAsync(ObtenerProductoPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var p = await _context.Productos
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == query.Id, cancellationToken);

        if (p is null)
            return Result<ProductoDto>.Failure($"No se encontró el producto con ID '{query.Id}'.");

        var dto = new ProductoDto(
            p.Id,
            p.Codigo,
            p.Nombre,
            p.Descripcion,
            p.Tipo,
            p.PrecioBase,
            p.CatalogoId,
            p.Categoria,
            p.UnidadMedida,
            p.EsSerializado,
            p.Activo,
            p.ConvertirEnActivoCliente,
            p.CodigoBarras,
            p.Notas,
            p.CostoActual,
            p.CostoEstandar,
            p.AfectoImpuesto,
            p.ProveedorDefecto
        );

        return Result<ProductoDto>.Success(dto);
    }
}
