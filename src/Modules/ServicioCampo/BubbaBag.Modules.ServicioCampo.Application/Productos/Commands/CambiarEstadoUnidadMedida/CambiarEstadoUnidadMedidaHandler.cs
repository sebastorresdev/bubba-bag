using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoUnidadMedida;

public record CambiarEstadoUnidadMedidaCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoUnidadMedidaHandler : ICommandHandler<CambiarEstadoUnidadMedidaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoUnidadMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoUnidadMedidaCommand command, CancellationToken cancellationToken = default)
    {
        var unidad = await _context.UnidadesMedida
            .FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken);

        if (unidad is null)
            return Result.Failure("La unidad de medida especificada no existe.");

        if (command.Activo)
            unidad.Activar();
        else
            unidad.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
