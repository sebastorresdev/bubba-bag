using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoProducto;

public record CambiarEstadoProductoCommand(
    Guid Id,
    bool Activo
) : ICommand<Result>;

public class CambiarEstadoProductoHandler : ICommandHandler<CambiarEstadoProductoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoProductoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoProductoCommand command, CancellationToken cancellationToken = default)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == command.Id, cancellationToken);
        if (producto is null)
            return Result.Failure($"No se encontró el producto con ID '{command.Id}'.");

        if (command.Activo)
            producto.Activar();
        else
            producto.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
