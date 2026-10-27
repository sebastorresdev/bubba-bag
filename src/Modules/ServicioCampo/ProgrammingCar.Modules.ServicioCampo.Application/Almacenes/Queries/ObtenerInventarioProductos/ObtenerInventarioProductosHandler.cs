using ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Dtos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerInventarioProductos;

public record ObtenerInventarioProductosQuery(
    Guid? AlmacenId = null,
    string? Buscar = null, Guid? UbicacionId = null
) : IQuery<Result<List<InventarioProductoDto>>>;

public class ObtenerInventarioProductosHandler
    : IQueryHandler<ObtenerInventarioProductosQuery, Result<List<InventarioProductoDto>>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _user;

    public ObtenerInventarioProductosHandler(IServicioCampoDbContext context, ICurrentUser user)
    {
        _context = context; _user = user;
    }

    public async Task<Result<List<InventarioProductoDto>>> HandleAsync(
        ObtenerInventarioProductosQuery query,
        CancellationToken cancellationToken = default)
    {
        var inventario = _context.StocksAlmacen
            .AsNoTracking()
            .Where(stock => InventarioAcceso.AlmacenesConsultables(_context, _user).Contains(stock.Ubicacion.AlmacenId) && stock.Producto.Tipo == TipoProducto.Inventario && stock.CantidadDisponible > 0);

        if (query.AlmacenId.HasValue)
            inventario = inventario.Where(stock => stock.Ubicacion.AlmacenId == query.AlmacenId.Value);

        if (query.UbicacionId.HasValue) inventario = inventario.Where(x => x.UbicacionId == query.UbicacionId.Value);
        if (!string.IsNullOrWhiteSpace(query.Buscar))
        {
            var buscar = query.Buscar.Trim();
            inventario = inventario.Where(stock =>
                stock.Producto.Codigo.Contains(buscar) ||
                stock.Producto.Nombre.Contains(buscar) ||
                stock.Ubicacion.Almacen.Nombre.Contains(buscar));
        }

        var resultado = await inventario
            .OrderBy(stock => stock.Producto.Nombre)
            .ThenBy(stock => stock.Ubicacion.Almacen.Nombre)
            .Select(stock => new InventarioProductoDto(
                stock.Id,
                stock.ProductoId,
                stock.Producto.Codigo,
                stock.Producto.Nombre,
                stock.Ubicacion.AlmacenId,
                stock.Ubicacion.Almacen.Nombre,
                stock.Producto.UnidadMedidaDefectoId,
                stock.Producto.UnidadMedidaDefecto != null
                    ? stock.Producto.UnidadMedidaDefecto.Nombre
                    : null,
                stock.CantidadDisponible,
                0m,
                stock.CantidadDisponible,
                stock.Producto.CostoActual,
                stock.CantidadDisponible * stock.Producto.CostoActual,
                stock.UpdatedAt,
                stock.Producto.EsSerializado, stock.UbicacionId, stock.Ubicacion.Nombre, stock.Condicion.ToString()))
            .ToListAsync(cancellationToken);

        return Result<List<InventarioProductoDto>>.Success(resultado);
    }
}
