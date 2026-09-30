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
            .Include(x => x.ListaPreciosPredeterminada)
            .Include(x => x.CategoriaProducto)
            .Include(x => x.GrupoUnidadMedida)
            .Include(x => x.UnidadMedidaDefecto)
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
            p.CategoriaProductoId,
            p.CategoriaProducto?.Nombre,
            p.GrupoUnidadMedidaId,
            p.GrupoUnidadMedida?.Nombre,
            p.UnidadMedidaDefectoId,
            p.UnidadMedidaDefecto?.Nombre,
            p.EsSerializado,
            p.Activo,
            p.CodigoBarras,
            p.Notas,
            p.CostoActual,
            p.CostoEstandar,
            p.AfectoImpuesto,
            p.ProveedorDefecto,
            p.ListaPreciosPredeterminadaId,
            p.ListaPreciosPredeterminada?.Nombre,
            p.DecimalesCantidad
        );

        return Result<ProductoDto>.Success(dto);
    }
}
