using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.ActualizarMotivoIncidencia;

public class ActualizarMotivoIncidenciaHandler : ICommandHandler<ActualizarMotivoIncidenciaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarMotivoIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarMotivoIncidenciaCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre.Trim();

        var motivo = await _context.MotivosIncidencia.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("Motivo de incidencia no encontrado.");

        motivo.Actualizar(nombreNormalizado, request.Ambito, request.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
