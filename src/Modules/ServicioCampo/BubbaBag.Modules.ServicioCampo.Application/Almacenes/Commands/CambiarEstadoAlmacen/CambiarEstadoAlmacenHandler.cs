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
    private readonly ICurrentUser _currentUser;

    public CambiarEstadoAlmacenHandler(IServicioCampoDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result> HandleAsync(CambiarEstadoAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken);
        if (almacen is null)
            return Result.Failure($"No se encontró el almacén con ID '{command.Id}'.");

        almacen.CambiarEstado(command.Activo, _currentUser.Id == Guid.Empty ? null : _currentUser.Id);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
