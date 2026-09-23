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
    string Categoria,
    string UnidadMedida,
    bool EsSerializado,
    string? Descripcion = null,
    TipoProducto Tipo = TipoProducto.Inventario,
    decimal PrecioBase = 0m,
    Guid? CatalogoId = null
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
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == command.Id, cancellationToken);
        if (producto is null)
            return Result.Failure($"No se encontró el producto con ID '{command.Id}'.");

        producto.Actualizar(
            command.Nombre,
            command.Categoria,
            command.UnidadMedida,
            command.EsSerializado,
            command.Descripcion,
            command.Tipo,
            command.PrecioBase,
            command.CatalogoId
        );

        // Si el producto es o pasa a ser Servicio, mantener sincronizado el catálogo operativo
        if (command.Tipo == TipoProducto.Servicio)
        {
            var servicio = await _context.Servicios.FirstOrDefaultAsync(
                s => s.Codigo == producto.Codigo || s.ProductoId == producto.Id,
                cancellationToken);

            if (servicio != null)
            {
                servicio.Actualizar(
                    nombre: command.Nombre,
                    duracionEstimadaMinutos: servicio.DuracionEstimadaMinutos,
                    descripcion: command.Descripcion,
                    codigoExterno: servicio.CodigoExterno,
                    precioBase: command.PrecioBase,
                    productoId: producto.Id
                );
            }
            else
            {
                var nuevoServicio = ProductoServicio.Crear(
                    codigo: producto.Codigo,
                    nombre: command.Nombre,
                    duracionEstimadaMinutos: 60,
                    descripcion: command.Descripcion,
                    codigoExterno: null,
                    precioBase: command.PrecioBase,
                    productoId: producto.Id
                );
                await _context.Servicios.AddAsync(nuevoServicio, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
