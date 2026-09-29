using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ActualizarAlmacen;

public record ActualizarAlmacenCommand(
    Guid Id,
    string Nombre,
    string? Descripcion = null
) : ICommand<Result>;

public class ActualizarAlmacenHandler : ICommandHandler<ActualizarAlmacenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ActualizarAlmacenHandler(IServicioCampoDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result> HandleAsync(ActualizarAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken);
        if (almacen is null)
            return Result.Failure($"No se encontró el almacén con ID '{command.Id}'.");

        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result.Failure("El nombre del almacén es obligatorio.");
        if (command.Nombre.Trim().Length > 150)
            return Result.Failure("El nombre del almacén no puede superar los 150 caracteres.");
        if (command.Descripcion?.Length > 500)
            return Result.Failure("La descripción no puede superar los 500 caracteres.");

        almacen.Actualizar(command.Nombre, command.Descripcion, UsuarioActualId());
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private Guid? UsuarioActualId() => _currentUser.Id == Guid.Empty ? null : _currentUser.Id;
}
