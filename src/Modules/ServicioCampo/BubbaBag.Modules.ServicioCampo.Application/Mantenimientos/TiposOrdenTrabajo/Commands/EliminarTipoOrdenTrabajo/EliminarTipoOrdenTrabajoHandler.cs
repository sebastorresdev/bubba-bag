using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.EliminarTipoOrdenTrabajo;

public class EliminarTipoOrdenTrabajoHandler : ICommandHandler<EliminarTipoOrdenTrabajoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public EliminarTipoOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(EliminarTipoOrdenTrabajoCommand request, CancellationToken cancellationToken)
    {
        var tipo = await _context.TiposOrdenTrabajo.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tipo == null)
            return Result.Failure("Tipo de orden de trabajo no encontrado.");

        _context.TiposOrdenTrabajo.Remove(tipo);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
