using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoGrupoUnidadMedida;

public record CambiarEstadoGrupoUnidadMedidaCommand(Guid Id, bool Activo) : ICommand<Result>;

public sealed class CambiarEstadoGrupoUnidadMedidaHandler
    : ICommandHandler<CambiarEstadoGrupoUnidadMedidaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoGrupoUnidadMedidaHandler(IServicioCampoDbContext context) => _context = context;

    public async Task<Result> HandleAsync(CambiarEstadoGrupoUnidadMedidaCommand command, CancellationToken cancellationToken = default)
    {
        var grupo = await _context.GruposUnidadMedida
            .Include(g => g.Unidades)
            .FirstOrDefaultAsync(g => g.Id == command.Id, cancellationToken);
        if (grupo is null)
            return Result.Failure("No se encontró el grupo de unidades de medida.");

        if (command.Activo)
        {
            grupo.Activar();
            foreach (var unidad in grupo.Unidades) unidad.Activar();
        }
        else
        {
            var enUso = await _context.Productos.AnyAsync(p => p.GrupoUnidadMedidaId == command.Id && p.Activo, cancellationToken);
            if (enUso)
                return Result.Failure("No se puede desactivar un grupo utilizado por productos activos.");

            grupo.Desactivar();
            foreach (var unidad in grupo.Unidades) unidad.Desactivar();
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
