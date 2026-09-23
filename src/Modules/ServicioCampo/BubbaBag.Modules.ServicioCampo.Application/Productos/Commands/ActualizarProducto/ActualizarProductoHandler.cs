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

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
