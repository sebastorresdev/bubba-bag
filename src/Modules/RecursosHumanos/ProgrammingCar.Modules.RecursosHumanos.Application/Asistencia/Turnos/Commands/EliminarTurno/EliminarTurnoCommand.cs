using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Commands.EliminarTurno;

public record EliminarTurnoCommand(Guid Id) : ICommand<Result>;

public class EliminarTurnoHandler : ICommandHandler<EliminarTurnoCommand, Result>
{
    private readonly IRecursosHumanosDbContext _context;

    public EliminarTurnoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(EliminarTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _context.Turnos.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (turno is null)
        {
            return Result.Failure("El turno no existe.");
        }

        var tieneEmpleados = await _context.Empleados.AnyAsync(e => e.TurnoId == request.Id, cancellationToken);
        if (tieneEmpleados)
        {
            return Result.Failure("No se puede eliminar el turno porque está asignado a uno o más colaboradores. Desasígnelo primero.");
        }

        _context.Turnos.Remove(turno);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
