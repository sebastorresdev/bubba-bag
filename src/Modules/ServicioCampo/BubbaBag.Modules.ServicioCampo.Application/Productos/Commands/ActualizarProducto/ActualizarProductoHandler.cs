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
    string? Categoria = null,
    string UnidadMedida = "Unidades",
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
        if (command.DecimalesCantidad is < 0 or > 5)
            return Result.Failure("Los decimales de cantidad deben estar entre 0 y 5.");

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
