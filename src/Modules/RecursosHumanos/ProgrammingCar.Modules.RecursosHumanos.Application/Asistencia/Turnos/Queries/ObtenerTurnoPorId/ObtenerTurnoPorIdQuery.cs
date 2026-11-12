using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Queries.ObtenerTurnoPorId;

public record ObtenerTurnoPorIdQuery(Guid Id) : IQuery<Result<TurnoDto>>;

public class ObtenerTurnoPorIdHandler : IQueryHandler<ObtenerTurnoPorIdQuery, Result<TurnoDto>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerTurnoPorIdHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TurnoDto>> HandleAsync(ObtenerTurnoPorIdQuery request, CancellationToken cancellationToken)
    {
        var t = await _context.Turnos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (t is null)
        {
            return Result<TurnoDto>.Failure("El turno no existe.");
        }

        return Result<TurnoDto>.Success(new TurnoDto(
            t.Id,
            t.Codigo,
            t.Nombre,
            t.HoraInicio.ToString("HH:mm"),
            t.HoraFin.ToString("HH:mm"),
            t.CruzaMedianoche,
            t.MinutosRefrigerio,
            t.MinutosToleranciaEntrada,
            t.MinutosToleranciaRefrigerio,
            t.ObtenerHorasNetasJornada(),
            t.Activo
        ));
    }
}
