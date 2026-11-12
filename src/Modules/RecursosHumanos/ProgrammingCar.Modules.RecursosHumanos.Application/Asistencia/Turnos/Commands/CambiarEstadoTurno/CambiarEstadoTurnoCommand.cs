using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Commands.CambiarEstadoTurno;

public record CambiarEstadoTurnoCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoTurnoHandler : ICommandHandler<CambiarEstadoTurnoCommand, Result>
{
    private readonly IRecursosHumanosDbContext _context;

    public CambiarEstadoTurnoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _context.Turnos.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (turno is null)
        {
            return Result.Failure("El turno no existe.");
        }

        turno.CambiarEstado(request.Activo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
