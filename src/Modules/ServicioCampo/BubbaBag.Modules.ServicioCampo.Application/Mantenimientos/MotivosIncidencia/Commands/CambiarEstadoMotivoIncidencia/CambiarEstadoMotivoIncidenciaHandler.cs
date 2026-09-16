using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CambiarEstadoMotivoIncidencia;

public class CambiarEstadoMotivoIncidenciaHandler : ICommandHandler<CambiarEstadoMotivoIncidenciaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoMotivoIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoMotivoIncidenciaCommand request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosIncidencia.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("Motivo de incidencia no encontrado.");

        if (request.Activo)
            motivo.Activar();
        else
            motivo.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
