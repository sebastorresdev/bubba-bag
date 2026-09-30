using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarGrupoUnidadMedida;

public record ActualizarGrupoUnidadMedidaCommand(
    Guid Id,
    string Nombre,
    string? Observacion) : ICommand<Result>;

public sealed class ActualizarGrupoUnidadMedidaHandler
    : ICommandHandler<ActualizarGrupoUnidadMedidaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarGrupoUnidadMedidaHandler(IServicioCampoDbContext context) => _context = context;

    public async Task<Result> HandleAsync(ActualizarGrupoUnidadMedidaCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result.Failure("El nombre del grupo es obligatorio.");

        var grupo = await _context.GruposUnidadMedida
            .FirstOrDefaultAsync(g => g.Id == command.Id, cancellationToken);
        if (grupo is null)
            return Result.Failure("No se encontró el grupo de unidades de medida.");

        var nombre = command.Nombre.Trim();
        if (await _context.GruposUnidadMedida.AnyAsync(g => g.Id != command.Id && g.Nombre == nombre, cancellationToken))
            return Result.Failure($"Ya existe un grupo llamado '{nombre}'.");

        grupo.Actualizar(nombre, command.Observacion);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
