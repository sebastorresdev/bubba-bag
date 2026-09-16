using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CambiarEstadoTipoTareaServicio;

public class CambiarEstadoTipoTareaServicioHandler : ICommandHandler<CambiarEstadoTipoTareaServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoTipoTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoTipoTareaServicioCommand request, CancellationToken cancellationToken)
    {
        var tarea = await _context.TiposTareaServicio.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tarea == null)
            return Result.Failure("Tipo de tarea de servicio no encontrado.");

        if (request.Activo)
            tarea.Activar();
        else
            tarea.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
