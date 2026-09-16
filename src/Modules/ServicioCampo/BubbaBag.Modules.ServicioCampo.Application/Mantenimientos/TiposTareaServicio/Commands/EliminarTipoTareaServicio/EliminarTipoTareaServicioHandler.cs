using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.EliminarTipoTareaServicio;

public class EliminarTipoTareaServicioHandler : ICommandHandler<EliminarTipoTareaServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public EliminarTipoTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(EliminarTipoTareaServicioCommand request, CancellationToken cancellationToken)
    {
        var tarea = await _context.TiposTareaServicio.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tarea == null)
            return Result.Failure("Tipo de tarea de servicio no encontrado.");

        _context.TiposTareaServicio.Remove(tarea);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
