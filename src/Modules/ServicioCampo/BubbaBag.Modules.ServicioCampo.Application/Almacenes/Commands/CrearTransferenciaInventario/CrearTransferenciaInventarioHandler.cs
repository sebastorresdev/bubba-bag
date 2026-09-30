using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearTransferenciaInventario;

public record LineaTransferenciaInventario(Guid ProductoId, decimal Cantidad);

public record CrearTransferenciaInventarioCommand(
    Guid AlmacenOrigenId,
    Guid AlmacenDestinoId,
    IReadOnlyCollection<LineaTransferenciaInventario> Lineas,
    string? Observacion = null
) : ICommand<Result<string>>;

public class CrearTransferenciaInventarioHandler
    : ICommandHandler<CrearTransferenciaInventarioCommand, Result<string>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearTransferenciaInventarioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> HandleAsync(
        CrearTransferenciaInventarioCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.AlmacenOrigenId == command.AlmacenDestinoId)
            return Result<string>.Failure("Los almacenes de origen y destino deben ser diferentes.");
        if (command.Lineas.Count == 0)
            return Result<string>.Failure("La transferencia debe contener al menos un producto.");
        if (command.Lineas.Any(linea => linea.ProductoId == Guid.Empty || linea.Cantidad <= 0))
            return Result<string>.Failure("Todas las líneas deben tener un producto y una cantidad mayor a cero.");

        var almacenesValidos = await _context.Almacenes.CountAsync(
            almacen => (almacen.Id == command.AlmacenOrigenId || almacen.Id == command.AlmacenDestinoId) && almacen.Activo,
            cancellationToken);
        if (almacenesValidos != 2)
            return Result<string>.Failure("El almacén de origen o destino no existe o está inactivo.");

        var lineas = command.Lineas
            .GroupBy(linea => linea.ProductoId)
            .Select(grupo => new LineaTransferenciaInventario(grupo.Key, grupo.Sum(linea => linea.Cantidad)))
            .ToList();
        var productosIds = lineas.Select(linea => linea.ProductoId).ToList();
        var productosValidos = await _context.Productos.CountAsync(
            producto => productosIds.Contains(producto.Id)
                        && producto.Activo
                        && producto.Tipo == TipoProducto.Inventario
                        && !producto.EsSerializado,
            cancellationToken);
        if (productosValidos != productosIds.Count)
            return Result<string>.Failure("Algún producto no existe, está inactivo, no es inventariable o requiere control por serie.");

        var stocksOrigen = await _context.StocksAlmacen
            .Where(stock => stock.AlmacenId == command.AlmacenOrigenId && productosIds.Contains(stock.ProductoId))
            .ToDictionaryAsync(stock => stock.ProductoId, cancellationToken);
        foreach (var linea in lineas)
        {
            if (!stocksOrigen.TryGetValue(linea.ProductoId, out var stock) || stock.CantidadDisponible < linea.Cantidad)
                return Result<string>.Failure("No existe stock disponible suficiente para uno de los productos seleccionados.");
        }

        var numero = $"TRF-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";

        try
        {
            await _context.EjecutarEnTransaccionAsync(async ct =>
            {
                var stocksDestino = await _context.StocksAlmacen
                    .Where(stock => stock.AlmacenId == command.AlmacenDestinoId && productosIds.Contains(stock.ProductoId))
                    .ToDictionaryAsync(stock => stock.ProductoId, ct);

                foreach (var linea in lineas)
                {
                    stocksOrigen[linea.ProductoId].DisminuirStock(linea.Cantidad);

                    if (!stocksDestino.TryGetValue(linea.ProductoId, out var stockDestino))
                    {
                        stockDestino = StockAlmacen.Crear(command.AlmacenDestinoId, linea.ProductoId);
                        await _context.StocksAlmacen.AddAsync(stockDestino, ct);
                        stocksDestino[linea.ProductoId] = stockDestino;
                    }
                    stockDestino.AumentarStock(linea.Cantidad);

                    await _context.MovimientosInventario.AddAsync(
                        MovimientoInventario.Registrar(
                            TipoMovimientoInventario.TransferenciaAlmacenes,
                            linea.ProductoId,
                            linea.Cantidad,
                            command.AlmacenOrigenId,
                            command.AlmacenDestinoId,
                            numeroDocumento: numero,
                            observaciones: command.Observacion),
                        ct);
                }

                await _context.SaveChangesAsync(ct);
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"No se pudo registrar la transferencia: {ex.Message}");
        }

        return Result<string>.Success(numero);
    }
}
