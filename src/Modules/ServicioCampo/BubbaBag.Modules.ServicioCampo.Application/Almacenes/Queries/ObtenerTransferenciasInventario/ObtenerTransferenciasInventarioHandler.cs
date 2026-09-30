using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciasInventario;

public record ObtenerTransferenciasInventarioQuery : IQuery<Result<List<TransferenciaInventarioDto>>>;

public class ObtenerTransferenciasInventarioHandler
    : IQueryHandler<ObtenerTransferenciasInventarioQuery, Result<List<TransferenciaInventarioDto>>>
{
    private readonly IServicioCampoDbContext _context;
    public ObtenerTransferenciasInventarioHandler(IServicioCampoDbContext context) => _context = context;

    public async Task<Result<List<TransferenciaInventarioDto>>> HandleAsync(
        ObtenerTransferenciasInventarioQuery query,
        CancellationToken cancellationToken = default)
    {
        var transferencias = await _context.MovimientosInventario
            .AsNoTracking()
            .Where(movimiento => movimiento.Tipo == TipoMovimientoInventario.TransferenciaAlmacenes)
            .OrderByDescending(movimiento => movimiento.FechaMovimiento)
            .Select(movimiento => new TransferenciaInventarioDto(
                movimiento.Id,
                movimiento.NumeroDocumento ?? "—",
                movimiento.FechaMovimiento,
                movimiento.AlmacenOrigenId!.Value,
                movimiento.AlmacenOrigen!.Nombre,
                movimiento.AlmacenDestinoId!.Value,
                movimiento.AlmacenDestino!.Nombre,
                movimiento.ProductoId,
                movimiento.Producto.Codigo,
                movimiento.Producto.Nombre,
                movimiento.Cantidad,
                movimiento.Producto.UnidadMedidaDefecto != null ? movimiento.Producto.UnidadMedidaDefecto.Nombre : null,
                movimiento.Observaciones))
            .ToListAsync(cancellationToken);

        return Result<List<TransferenciaInventarioDto>>.Success(transferencias);
    }
}
