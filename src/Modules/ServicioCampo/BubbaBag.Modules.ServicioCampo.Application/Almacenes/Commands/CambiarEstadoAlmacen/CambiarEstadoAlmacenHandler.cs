using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CambiarEstadoAlmacen;

public record CambiarEstadoAlmacenCommand(
    Guid Id,
    bool Activo
) : ICommand<Result>;

public class CambiarEstadoAlmacenHandler : ICommandHandler<CambiarEstadoAlmacenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoAlmacenHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken);
        if (almacen is null)
            return Result.Failure($"No se encontró el almacén con ID '{command.Id}'.");

        if (command.Activo)
            almacen.Activar();
        else
            almacen.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
