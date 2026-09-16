using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CambiarEstadoTipoOrdenTrabajo;

public class CambiarEstadoTipoOrdenTrabajoHandler : ICommandHandler<CambiarEstadoTipoOrdenTrabajoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoTipoOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoTipoOrdenTrabajoCommand request, CancellationToken cancellationToken)
    {
        var tipo = await _context.TiposOrdenTrabajo.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tipo == null)
            return Result.Failure("Tipo de orden de trabajo no encontrado.");

        if (request.Activo)
            tipo.Activar();
        else
            tipo.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
