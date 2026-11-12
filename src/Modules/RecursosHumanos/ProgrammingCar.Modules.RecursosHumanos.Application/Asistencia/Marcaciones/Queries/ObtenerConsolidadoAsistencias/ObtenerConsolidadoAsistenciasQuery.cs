using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Marcaciones.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Marcaciones.Queries.ObtenerConsolidadoAsistencias;

public record ObtenerConsolidadoAsistenciasQuery(
    DateOnly? FechaInicio = null,
    DateOnly? FechaFin = null,
    Guid? EmpleadoId = null,
    Guid? DepartamentoId = null,
    int? Estado = null
) : IQuery<Result<List<AsistenciaDiariaDto>>>;

public class ObtenerConsolidadoAsistenciasHandler : IQueryHandler<ObtenerConsolidadoAsistenciasQuery, Result<List<AsistenciaDiariaDto>>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerConsolidadoAsistenciasHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AsistenciaDiariaDto>>> HandleAsync(ObtenerConsolidadoAsistenciasQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AsistenciasDiarias
            .AsNoTracking()
            .Include(a => a.Empleado)
            .Include(a => a.Turno)
            .AsQueryable();

        if (request.FechaInicio.HasValue)
        {
            query = query.Where(a => a.FechaOperativa >= request.FechaInicio.Value);
        }

        if (request.FechaFin.HasValue)
        {
            query = query.Where(a => a.FechaOperativa <= request.FechaFin.Value);
        }

        if (request.EmpleadoId.HasValue)
        {
            query = query.Where(a => a.EmpleadoId == request.EmpleadoId.Value);
        }

        if (request.DepartamentoId.HasValue)
        {
            query = query.Where(a => a.Empleado.DepartamentoId == request.DepartamentoId.Value);
        }

        if (request.Estado.HasValue)
        {
            query = query.Where(a => (int)a.Estado == request.Estado.Value);
        }

        var asistencias = await query
            .OrderByDescending(a => a.FechaOperativa)
            .ThenBy(a => a.Empleado.Apellidos)
            .Take(1000)
            .Select(a => new AsistenciaDiariaDto(
                a.Id,
                a.EmpleadoId,
                $"{a.Empleado.Nombres} {a.Empleado.Apellidos}",
                a.Empleado.NumeroDocumento,
                a.FechaOperativa.ToString("yyyy-MM-dd"),
                a.TurnoId,
                a.Turno != null ? a.Turno.Nombre : "Sin turno",
                a.HoraEntradaProgramada.HasValue ? a.HoraEntradaProgramada.Value.ToString("HH:mm") : null,
                a.HoraSalidaProgramada.HasValue ? a.HoraSalidaProgramada.Value.ToString("HH:mm") : null,
                a.HoraEntradaReal.HasValue ? a.HoraEntradaReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                a.HoraSalidaReal.HasValue ? a.HoraSalidaReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                a.HoraInicioRefrigerioReal.HasValue ? a.HoraInicioRefrigerioReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                a.HoraFinRefrigerioReal.HasValue ? a.HoraFinRefrigerioReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                a.MinutosTardanza,
                a.MinutosExcesoRefrigerio,
                a.HorasTrabajadas,
                (int)a.Estado,
                a.Estado.ToString(),
                a.Observacion
            ))
            .ToListAsync(cancellationToken);

        return Result<List<AsistenciaDiariaDto>>.Success(asistencias);
    }
}
