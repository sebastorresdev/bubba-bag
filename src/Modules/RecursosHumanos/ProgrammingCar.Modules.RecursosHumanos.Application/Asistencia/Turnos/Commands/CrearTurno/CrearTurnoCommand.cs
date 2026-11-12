using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Commands.CrearTurno;

public record CrearTurnoCommand(
    string Codigo,
    string Nombre,
    string HoraInicio, // "HH:mm"
    string HoraFin,    // "HH:mm"
    int MinutosRefrigerio = 60,
    int MinutosToleranciaEntrada = 15,
    int MinutosToleranciaRefrigerio = 5
) : ICommand<Result<Guid>>;

public class CrearTurnoHandler : ICommandHandler<CrearTurnoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public CrearTurnoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearTurnoCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Codigo))
        {
            return Result<Guid>.Failure("El código del turno es obligatorio.");
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

        var codigoNorm = request.Codigo.Trim().ToUpperInvariant();
        if (await _context.Turnos.AnyAsync(t => t.Codigo == codigoNorm, cancellationToken))
        {
            return Result<Guid>.Failure($"Ya existe un turno con el código '{codigoNorm}'.");
        }

        var turno = new Turno(
            Guid.NewGuid(),
            codigoNorm,
            request.Nombre.Trim(),
            horaInicio,
            horaFin,
            request.MinutosRefrigerio,
            request.MinutosToleranciaEntrada,
            request.MinutosToleranciaRefrigerio
        );

        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(turno.Id);
    }
}
