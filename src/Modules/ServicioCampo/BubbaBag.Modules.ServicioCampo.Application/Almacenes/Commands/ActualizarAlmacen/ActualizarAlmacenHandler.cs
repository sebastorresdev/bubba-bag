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
    string? Descripcion = null,
    string? Direccion = null,
    string? Telefono = null,
    Guid? SucursalId = null,
    Guid? RecursoId = null
) : ICommand<Result>;

public class ActualizarAlmacenHandler : ICommandHandler<ActualizarAlmacenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarAlmacenHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken);
        if (almacen is null)
            return Result.Failure($"No se encontró el almacén con ID '{command.Id}'.");

        almacen.Actualizar(command.Nombre, command.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
