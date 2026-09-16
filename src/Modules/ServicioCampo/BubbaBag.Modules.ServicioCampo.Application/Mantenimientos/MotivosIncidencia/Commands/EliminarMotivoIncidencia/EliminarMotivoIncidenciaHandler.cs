using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.EliminarMotivoIncidencia;

public class EliminarMotivoIncidenciaHandler : ICommandHandler<EliminarMotivoIncidenciaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public EliminarMotivoIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(EliminarMotivoIncidenciaCommand request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosIncidencia.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("Motivo de incidencia no encontrado.");

        _context.MotivosIncidencia.Remove(motivo);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
