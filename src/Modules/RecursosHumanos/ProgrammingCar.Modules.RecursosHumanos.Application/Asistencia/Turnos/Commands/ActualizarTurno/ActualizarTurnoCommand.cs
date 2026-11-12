using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Commands.ActualizarTurno;

public record ActualizarTurnoCommand(
    Guid Id,
    string Nombre,
    string HoraInicio,
    string HoraFin,
    int MinutosRefrigerio,
    int MinutosToleranciaEntrada,
    int MinutosToleranciaRefrigerio,
    bool Activo
) : ICommand<Result<Guid>>;

public class ActualizarTurnoHandler : ICommandHandler<ActualizarTurnoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ActualizarTurnoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(ActualizarTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _context.Turnos.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (turno is null)
        {
            return Result<Guid>.Failure("El turno no existe.");
        }

        if (string.IsNullOrWhiteSpace(request.Nombre))
        {
            return Result<Guid>.Failure("El nombre del turno es obligatorio.");
        }
        if (!TimeOnly.TryParse(request.HoraInicio, out var horaInicio))
        {
            return Result<Guid>.Failure("Formato de hora de inicio inválido (HH:mm).");
        }
        if (!TimeOnly.TryParse(request.HoraFin, out var horaFin))
        {
            return Result<Guid>.Failure("Formato de hora de fin inválido (HH:mm).");
        }

        var ventanaEntradaInicio = horaInicio.AddHours(-2);
        var ventanaEntradaFin = horaInicio.AddHours(2);
        var ventanaSalidaInicio = horaFin.AddHours(-2);
        var ventanaSalidaFin = horaFin.AddHours(4);

        turno.Actualizar(
            request.Nombre,
            horaInicio,
            horaFin,
            request.MinutosRefrigerio,
            request.MinutosToleranciaEntrada,
            request.MinutosToleranciaRefrigerio,
            ventanaEntradaInicio,
            ventanaEntradaFin,
            ventanaSalidaInicio,
            ventanaSalidaFin
        );
        turno.CambiarEstado(request.Activo);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(turno.Id);
    }
}
