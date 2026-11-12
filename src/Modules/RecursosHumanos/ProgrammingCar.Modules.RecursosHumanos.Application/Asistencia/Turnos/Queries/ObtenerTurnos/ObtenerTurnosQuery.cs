using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Queries.ObtenerTurnos;

public record ObtenerTurnosQuery(string? SearchTerm = null, bool? Activo = null) : IQuery<Result<List<TurnoDto>>>;

public class ObtenerTurnosHandler : IQueryHandler<ObtenerTurnosQuery, Result<List<TurnoDto>>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerTurnosHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TurnoDto>>> HandleAsync(ObtenerTurnosQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Turnos.AsNoTracking();

        if (request.Activo.HasValue)
        {
            query = query.Where(t => t.Activo == request.Activo.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(t => t.Nombre.ToLower().Contains(term) || t.Codigo.ToLower().Contains(term));
        }

        var turnos = await query
            .OrderBy(t => t.Nombre)
            .Select(t => new TurnoDto(
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
            ))
            .ToListAsync(cancellationToken);

        return Result<List<TurnoDto>>.Success(turnos);
    }
}
