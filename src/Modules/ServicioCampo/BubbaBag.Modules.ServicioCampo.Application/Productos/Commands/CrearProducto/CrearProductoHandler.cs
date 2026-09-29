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
    string? Categoria = null,
    string UnidadMedida = "Unidades",
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
        if (command.DecimalesCantidad is < 0 or > 5)
            return Result<Guid>.Failure("Los decimales de cantidad deben estar entre 0 y 5.");

        var codigoUpper = command.Codigo.Trim().ToUpperInvariant();
        var existe = await _context.Productos.AnyAsync(p => p.Codigo == codigoUpper, cancellationToken);
        if (existe)
        {
            return Result<Guid>.Failure($"Ya existe un producto con el código '{codigoUpper}'.");
        }

        var producto = Producto.Crear(
            codigo: codigoUpper,
            nombre: command.Nombre,
            categoria: command.Categoria,
            unidadMedida: command.UnidadMedida,
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

        // Si se especificó una lista de precios predeterminada, crear el elemento de lista de precios inicial
        if (command.ListaPreciosPredeterminadaId.HasValue)
        {
            var unidad = await _context.UnidadesMedida.FirstOrDefaultAsync(u => u.Nombre == command.UnidadMedida, cancellationToken);
            var elemento = ElementoListaPrecios.Crear(
                listaPreciosId: command.ListaPreciosPredeterminadaId.Value,
                productoId: producto.Id,
                monto: command.PrecioBase,
                unidadMedidaId: unidad?.Id
            );
            await _context.ElementosListaPrecios.AddAsync(elemento, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(producto.Id);
    }
}
