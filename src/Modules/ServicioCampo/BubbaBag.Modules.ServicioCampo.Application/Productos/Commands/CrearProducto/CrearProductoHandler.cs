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
    Guid? CatalogoId = null,
    string Categoria = "Materiales",
    string UnidadMedida = "Unidades",
    bool EsSerializado = false,
    string? Descripcion = null,
    bool ConvertirEnActivoCliente = false,
    string? CodigoBarras = null,
    string? Notas = null,
    decimal CostoActual = 0m,
    decimal CostoEstandar = 0m,
    bool AfectoImpuesto = true,
    string? ProveedorDefecto = null
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
            catalogoId: command.CatalogoId,
            convertirEnActivoCliente: command.ConvertirEnActivoCliente,
            codigoBarras: command.CodigoBarras,
            notas: command.Notas,
            costoActual: command.CostoActual,
            costoEstandar: command.CostoEstandar,
            afectoImpuesto: command.AfectoImpuesto,
            proveedorDefecto: command.ProveedorDefecto
        );

        await _context.Productos.AddAsync(producto, cancellationToken);

        // Si el producto es de tipo Servicio, asegurar la existencia de la entidad ProductoServicio operativa
        if (command.Tipo == TipoProducto.Servicio)
        {
            var existeServicio = await _context.Servicios.AnyAsync(s => s.Codigo == codigoUpper, cancellationToken);
            if (!existeServicio)
            {
                var servicio = ProductoServicio.Crear(
                    codigo: codigoUpper,
                    nombre: command.Nombre,
                    duracionEstimadaMinutos: 60,
                    descripcion: command.Descripcion,
                    codigoExterno: null,
                    precioBase: command.PrecioBase,
                    productoId: producto.Id
                );
                await _context.Servicios.AddAsync(servicio, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(producto.Id);
    }
}
