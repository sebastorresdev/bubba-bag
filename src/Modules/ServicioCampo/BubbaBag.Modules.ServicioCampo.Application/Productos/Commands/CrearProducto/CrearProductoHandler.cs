using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearProducto;

public record CrearProductoCommand(
    string Codigo,
    string Nombre,
    TipoProducto Tipo = TipoProducto.Inventario,
    decimal PrecioBase = 0m,
    Guid? CategoriaProductoId = null,
    Guid? GrupoUnidadMedidaId = null,
    Guid? UnidadMedidaDefectoId = null,
    bool EsSerializado = false,
    string? Descripcion = null,
    string? CodigoBarras = null,
    string? Notas = null,
    decimal CostoActual = 0m,
    decimal CostoEstandar = 0m,
    bool AfectoImpuesto = true,
    string? ProveedorDefecto = null,
    Guid? ListaPreciosPredeterminadaId = null,
    int DecimalesCantidad = 0
) : ICommand<Result<Guid>>;

public class CrearProductoHandler : ICommandHandler<CrearProductoCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearProductoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearProductoCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Codigo))
            return Result<Guid>.Failure("El código del producto es obligatorio.");
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre del producto es obligatorio.");
        if (command.DecimalesCantidad is < 0 or > 5)
            return Result<Guid>.Failure("Los decimales de cantidad deben estar entre 0 y 5.");

        var codigoUpper = command.Codigo.Trim().ToUpperInvariant();
        var existe = await _context.Productos.AnyAsync(p => p.Codigo == codigoUpper, cancellationToken);
        if (existe)
            return Result<Guid>.Failure($"Ya existe un producto con el código '{codigoUpper}'.");

        if (command.Tipo == TipoProducto.Inventario)
        {
            if (!command.GrupoUnidadMedidaId.HasValue || command.GrupoUnidadMedidaId == Guid.Empty)
                return Result<Guid>.Failure("Los productos de tipo Inventario requieren especificar un Grupo de Unidades de Medida.");

            if (!command.UnidadMedidaDefectoId.HasValue || command.UnidadMedidaDefectoId == Guid.Empty)
                return Result<Guid>.Failure("Los productos de tipo Inventario requieren especificar una Unidad de Medida predeterminada.");
        }

        if (command.GrupoUnidadMedidaId.HasValue != command.UnidadMedidaDefectoId.HasValue)
            return Result<Guid>.Failure("El grupo y la unidad predeterminada deben especificarse juntos.");

        if (command.GrupoUnidadMedidaId.HasValue)
        {
            var grupoId = command.GrupoUnidadMedidaId.Value;
            var unidadId = command.UnidadMedidaDefectoId!.Value;
            var grupoActivo = await _context.GruposUnidadMedida
                .AnyAsync(g => g.Id == grupoId && g.EstaActivo, cancellationToken);
            if (!grupoActivo)
                return Result<Guid>.Failure("El grupo de unidades indicado no existe o está inactivo.");

            var unidadValida = await _context.UnidadesMedida
                .AnyAsync(u => u.Id == unidadId
                            && u.GrupoUnidadMedidaId == grupoId
                            && u.EstaActivo, cancellationToken);
            if (!unidadValida)
                return Result<Guid>.Failure("La unidad predeterminada no pertenece al grupo indicado o está inactiva.");
        }

        if (command.CategoriaProductoId.HasValue)
        {
            var categoriaValida = await _context.CategoriasProducto
                .AnyAsync(c => c.Id == command.CategoriaProductoId.Value && c.Activo, cancellationToken);
            if (!categoriaValida)
                return Result<Guid>.Failure("La categoría indicada no existe o está inactiva.");
        }

        if (command.ListaPreciosPredeterminadaId.HasValue)
        {
            var listaValida = await _context.ListasPrecios
                .AnyAsync(l => l.Id == command.ListaPreciosPredeterminadaId.Value && l.Activo, cancellationToken);
            if (!listaValida)
                return Result<Guid>.Failure("La lista de precios indicada no existe o está inactiva.");
        }

        if (!string.IsNullOrWhiteSpace(command.CodigoBarras))
        {
            var codigoBarras = command.CodigoBarras.Trim();
            var codigoBarrasDuplicado = await _context.Productos
                .AnyAsync(p => p.CodigoBarras == codigoBarras, cancellationToken);
            if (codigoBarrasDuplicado)
                return Result<Guid>.Failure("Ya existe un producto con el mismo código de barras.");
        }

        var producto = Producto.Crear(
            codigo: codigoUpper,
            nombre: command.Nombre,
            categoriaProductoId: command.CategoriaProductoId,
            grupoUnidadMedidaId: command.GrupoUnidadMedidaId,
            unidadMedidaDefectoId: command.UnidadMedidaDefectoId,
            esSerializado: command.EsSerializado,
            descripcion: command.Descripcion,
            tipo: command.Tipo,
            precioBase: command.PrecioBase,
            codigoBarras: command.CodigoBarras,
            notas: command.Notas,
            costoActual: command.CostoActual,
            costoEstandar: command.CostoEstandar,
            afectoImpuesto: command.AfectoImpuesto,
            proveedorDefecto: command.ProveedorDefecto,
            listaPreciosPredeterminadaId: command.ListaPreciosPredeterminadaId,
            decimalesCantidad: command.DecimalesCantidad
        );

        await _context.Productos.AddAsync(producto, cancellationToken);

        // Si se especificó lista de precios predeterminada, crear el elemento inicial
        if (command.ListaPreciosPredeterminadaId.HasValue)
        {
            var elemento = ElementoListaPrecios.Crear(
                listaPreciosId: command.ListaPreciosPredeterminadaId.Value,
                productoId: producto.Id,
                monto: command.PrecioBase,
                unidadMedidaId: command.UnidadMedidaDefectoId
            );
            await _context.ElementosListaPrecios.AddAsync(elemento, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(producto.Id);
    }
}
