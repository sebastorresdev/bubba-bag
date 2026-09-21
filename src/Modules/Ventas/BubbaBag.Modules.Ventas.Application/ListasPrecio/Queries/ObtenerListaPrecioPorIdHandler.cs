using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Ventas.Application.ListasPrecio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Ventas.Application.ListasPrecio.Queries;

public record ObtenerListaPrecioPorIdQuery(Guid Id) : IQuery<Result<ListaPrecioDetalleDto>>;

public class ObtenerListaPrecioPorIdHandler : IQueryHandler<ObtenerListaPrecioPorIdQuery, Result<ListaPrecioDetalleDto>>
{
    private readonly IVentasDbContext _context;

    public ObtenerListaPrecioPorIdHandler(IVentasDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ListaPrecioDetalleDto>> HandleAsync(ObtenerListaPrecioPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var lp = await _context.ListasPrecio
            .AsNoTracking()
            .Include(l => l.Items)
            .FirstOrDefaultAsync(l => l.Id == query.Id, cancellationToken);

        if (lp == null)
        {
            return Result<ListaPrecioDetalleDto>.Failure($"No se encontró la lista de precios con ID '{query.Id}'.");
        }

        var dto = new ListaPrecioDetalleDto(
            lp.Id,
            lp.Nombre,
            lp.Descripcion,
            lp.Moneda,
            lp.VigenciaDesde,
            lp.VigenciaHasta,
            lp.EsPredeterminada,
            lp.ClienteId,
            lp.Activo,
            lp.Items.Select(i => new ListaPrecioItemDto(
                i.Id,
                i.ListaPrecioId,
                i.ProductoId,
                null,
                null,
                null,
                i.PrecioUnitario
            )).ToList()
        );

        return Result<ListaPrecioDetalleDto>.Success(dto);
    }
}
