using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearAlmacen;

public record CrearAlmacenCommand(
    string Nombre,
    string? Descripcion = null
) : ICommand<Result<Guid>>;

public class CrearAlmacenHandler : ICommandHandler<CrearAlmacenCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _currentUser;

    public CrearAlmacenHandler(IServicioCampoDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> HandleAsync(CrearAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre del almacén es obligatorio.");

        if (command.Nombre.Trim().Length > 150)
            return Result<Guid>.Failure("El nombre del almacén no puede superar los 150 caracteres.");
        if (command.Descripcion?.Length > 500)
            return Result<Guid>.Failure("La descripción no puede superar los 500 caracteres.");

        var almacen = Almacen.Crear(command.Nombre, command.Descripcion, UsuarioActualId(), _currentUser.Nombre);

        await _context.Almacenes.AddAsync(almacen, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(almacen.Id);
    }

    private Guid? UsuarioActualId() => _currentUser.Id == Guid.Empty ? null : _currentUser.Id;
}
