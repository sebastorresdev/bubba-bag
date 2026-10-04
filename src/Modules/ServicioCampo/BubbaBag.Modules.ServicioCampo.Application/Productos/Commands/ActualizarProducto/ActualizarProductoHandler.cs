using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarProducto;

public record ActualizarProductoCommand(
    Guid Id,
    string Nombre,
    Guid? CategoriaProductoId = null,
    Guid? GrupoUnidadMedidaId = null,
    Guid? UnidadMedidaDefectoId = null,
    bool EsSerializado = false,
    string? Descripcion = null,
    TipoProducto Tipo = TipoProducto.Inventario,
    decimal PrecioBase = 0m,
    string? CodigoBarras = null,
    string? Notas = null,
    decimal CostoActual = 0m,
    decimal CostoEstandar = 0m,
    bool AfectoImpuesto = true,
    string? ProveedorDefecto = null,
    Guid? ListaPreciosPredeterminadaId = null,
    int? DecimalesCantidad = null
) : ICommand<Result>;

public class ActualizarProductoHandler : ICommandHandler<ActualizarProductoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarProductoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarProductoCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result.Failure("El nombre del producto es obligatorio.");
        if (command.DecimalesCantidad is < 0 or > 5)
            return Result.Failure("Los decimales de cantidad deben estar entre 0 y 5.");

        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == command.Id, cancellationToken);
        if (producto is null)
            return Result.Failure($"No se encontró el producto con ID '{command.Id}'.");

        if (command.Tipo == TipoProducto.Inventario)
        {
            if (!command.GrupoUnidadMedidaId.HasValue || command.GrupoUnidadMedidaId == Guid.Empty)
                return Result.Failure("Los productos de tipo Inventario requieren especificar un Grupo de Unidades de Medida.");

            if (!command.UnidadMedidaDefectoId.HasValue || command.UnidadMedidaDefectoId == Guid.Empty)
                return Result.Failure("Los productos de tipo Inventario requieren especificar una Unidad de Medida predeterminada.");
        }

        if (command.GrupoUnidadMedidaId.HasValue != command.UnidadMedidaDefectoId.HasValue)
            return Result.Failure("El grupo y la unidad predeterminada deben especificarse juntos.");

        if (command.GrupoUnidadMedidaId.HasValue)
        {
            var grupoId = command.GrupoUnidadMedidaId.Value;
            var unidadId = command.UnidadMedidaDefectoId!.Value;
            var grupoActivo = await _context.GruposUnidadMedida
                .AnyAsync(g => g.Id == grupoId && g.EstaActivo, cancellationToken);
            if (!grupoActivo)
                return Result.Failure("El grupo de unidades indicado no existe o está inactivo.");

            var unidadValida = await _context.UnidadesMedida
                .AnyAsync(u => u.Id == unidadId
                            && u.GrupoUnidadMedidaId == grupoId
                            && u.EstaActivo, cancellationToken);
            if (!unidadValida)
                return Result.Failure("La unidad predeterminada no pertenece al grupo indicado o está inactiva.");
        }

        if (command.CategoriaProductoId.HasValue)
        {
            var categoriaValida = await _context.CategoriasProducto
                .AnyAsync(c => c.Id == command.CategoriaProductoId.Value && c.Activo, cancellationToken);
            if (!categoriaValida)
                return Result.Failure("La categoría indicada no existe o está inactiva.");
        }

        if (command.ListaPreciosPredeterminadaId.HasValue)
        {
            var listaValida = await _context.ListasPrecios
                .AnyAsync(l => l.Id == command.ListaPreciosPredeterminadaId.Value && l.Activo, cancellationToken);
            if (!listaValida)
                return Result.Failure("La lista de precios indicada no existe o está inactiva.");
        }

        if (!string.IsNullOrWhiteSpace(command.CodigoBarras))
        {
            var codigoBarras = command.CodigoBarras.Trim();
            var codigoBarrasDuplicado = await _context.Productos
                .AnyAsync(p => p.Id != command.Id && p.CodigoBarras == codigoBarras, cancellationToken);
            if (codigoBarrasDuplicado)
                return Result.Failure("Ya existe un producto con el mismo código de barras.");
        }

        if ((producto.Tipo != command.Tipo || producto.EsSerializado != command.EsSerializado || producto.UnidadMedidaDefectoId != command.UnidadMedidaDefectoId || producto.GrupoUnidadMedidaId != command.GrupoUnidadMedidaId || command.DecimalesCantidad.HasValue && command.DecimalesCantidad.Value != producto.DecimalesCantidad) &&
            (await _context.StocksAlmacen.AnyAsync(x=>x.ProductoId==producto.Id,cancellationToken) || await _context.ItemsSeriados.AnyAsync(x=>x.ProductoId==producto.Id,cancellationToken) || await _context.TransferenciaDetalles.AnyAsync(x=>x.ProductoId==producto.Id,cancellationToken)))
            return Result.Failure("El producto ya tiene inventario o movimientos. Conserve unidad, tipo, seriado y precisión para mantener su trazabilidad.");
        producto.Actualizar(
            command.Nombre,
            command.CategoriaProductoId,
            command.GrupoUnidadMedidaId,
            command.UnidadMedidaDefectoId,
            command.EsSerializado,
            command.Descripcion,
            command.Tipo,
            command.PrecioBase,
            command.CodigoBarras,
            command.Notas,
            command.CostoActual,
            command.CostoEstandar,
            command.AfectoImpuesto,
            command.ProveedorDefecto,
            command.ListaPreciosPredeterminadaId,
            command.DecimalesCantidad ?? producto.DecimalesCantidad
        );

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
