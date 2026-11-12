using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Marcaciones.Dtos;
using ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Marcaciones.Queries.ObtenerMiAsistenciaHoy;

public record ObtenerMiAsistenciaHoyQuery(Guid? EmpleadoId = null) : IQuery<Result<MiEstadoAsistenciaHoyDto>>;

public class ObtenerMiAsistenciaHoyHandler : IQueryHandler<ObtenerMiAsistenciaHoyQuery, Result<MiEstadoAsistenciaHoyDto>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ObtenerMiAsistenciaHoyHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<MiEstadoAsistenciaHoyDto>> HandleAsync(ObtenerMiAsistenciaHoyQuery request, CancellationToken cancellationToken)
    {
        Guid empleadoId;
        if (request.EmpleadoId.HasValue && request.EmpleadoId.Value != Guid.Empty)
        {
            empleadoId = request.EmpleadoId.Value;
        }
        else
        {
            var email = _currentUser.Email;
            var emp = await _context.Empleados.FirstOrDefaultAsync(e => e.Email == email, cancellationToken);
            if (emp is null)
            {
                emp = await _context.Empleados.FirstOrDefaultAsync(e => e.Estado == Domain.Empleados.EstadoEmpleado.Activo, cancellationToken);
            }
            if (emp is null)
            {
                return Result<MiEstadoAsistenciaHoyDto>.Failure("No se encontró una ficha de colaborador asociada.");
            }
            empleadoId = emp.Id;
        }

        var empleado = await _context.Empleados
            .AsNoTracking()
            .Include(e => e.Departamento)
            .Include(e => e.Cargo)
            .Include(e => e.Turno)
            .FirstOrDefaultAsync(e => e.Id == empleadoId, cancellationToken);

        if (empleado is null)
        {
            return Result<MiEstadoAsistenciaHoyDto>.Failure("El colaborador no existe.");
        }

        var ahoraUtc = DateTimeOffset.UtcNow;
        var ahoraPe = ahoraUtc.ToOffset(TimeSpan.FromHours(-5));
        var fechaOperativa = DateOnly.FromDateTime(ahoraPe.DateTime);

        // Turno DTO
        TurnoDto? turnoDto = null;
        if (empleado.Turno != null)
        {
            var t = empleado.Turno;
            turnoDto = new TurnoDto(
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
            );
        }

        // Asistencia Diaria Hoy
        var asistencia = await _context.AsistenciasDiarias
            .AsNoTracking()
            .Include(a => a.Turno)
            .FirstOrDefaultAsync(a => a.EmpleadoId == empleado.Id && a.FechaOperativa == fechaOperativa, cancellationToken);

        AsistenciaDiariaDto? asistenciaDto = null;
        if (asistencia != null)
        {
            asistenciaDto = new AsistenciaDiariaDto(
                asistencia.Id,
                empleado.Id,
                $"{empleado.Nombres} {empleado.Apellidos}",
                empleado.NumeroDocumento,
                asistencia.FechaOperativa.ToString("yyyy-MM-dd"),
                asistencia.TurnoId,
                asistencia.Turno?.Nombre ?? turnoDto?.Nombre,
                asistencia.HoraEntradaProgramada?.ToString("HH:mm") ?? turnoDto?.HoraInicio,
                asistencia.HoraSalidaProgramada?.ToString("HH:mm") ?? turnoDto?.HoraFin,
                asistencia.HoraEntradaReal.HasValue ? asistencia.HoraEntradaReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                asistencia.HoraSalidaReal.HasValue ? asistencia.HoraSalidaReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                asistencia.HoraInicioRefrigerioReal.HasValue ? asistencia.HoraInicioRefrigerioReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                asistencia.HoraFinRefrigerioReal.HasValue ? asistencia.HoraFinRefrigerioReal.Value.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm:ss") : null,
                asistencia.MinutosTardanza,
                asistencia.MinutosExcesoRefrigerio,
                asistencia.HorasTrabajadas,
                (int)asistencia.Estado,
                asistencia.Estado.ToString(),
                asistencia.Observacion
            );
        }

        // Marcaciones de Hoy
        var inicioDiaUtc = new DateTimeOffset(fechaOperativa.ToDateTime(TimeOnly.MinValue), TimeSpan.FromHours(-5)).ToUniversalTime();
        var finDiaUtc = new DateTimeOffset(fechaOperativa.ToDateTime(TimeOnly.MaxValue), TimeSpan.FromHours(-5)).ToUniversalTime();

        var marcas = await _context.Marcaciones
            .AsNoTracking()
            .Where(m => m.EmpleadoId == empleado.Id && m.FechaHora >= inicioDiaUtc && m.FechaHora <= finDiaUtc)
            .OrderBy(m => m.FechaHora)
            .ToListAsync(cancellationToken);

        var marcasDto = marcas.Select(m => new MarcacionDto(
            m.Id,
            m.EmpleadoId,
            $"{empleado.Nombres} {empleado.Apellidos}",
            m.FechaHora.ToOffset(TimeSpan.FromHours(-5)),
            (int)m.TipoMarca,
            m.TipoMarca.ToString(),
            (int)m.Origen,
            m.Origen.ToString(),
            m.FotoUrl,
            m.Latitud,
            m.Longitud,
            m.EsValida
        )).ToList();

        // Determinar siguiente acción sugerida
        string accionSugerida = "Entrada";
        if (asistencia != null)
        {
            if (asistencia.HoraSalidaReal.HasValue)
            {
                accionSugerida = "Completado";
            }
            else if (asistencia.HoraInicioRefrigerioReal.HasValue && !asistencia.HoraFinRefrigerioReal.HasValue)
            {
                accionSugerida = "FinRefrigerio";
            }
            else if (asistencia.HoraEntradaReal.HasValue && !asistencia.HoraInicioRefrigerioReal.HasValue)
            {
                accionSugerida = "InicioRefrigerio";
            }
            else if (asistencia.HoraEntradaReal.HasValue)
            {
                accionSugerida = "Salida";
            }
        }

        var result = new MiEstadoAsistenciaHoyDto(
            empleado.Id,
            $"{empleado.Nombres} {empleado.Apellidos}",
            empleado.NumeroDocumento,
            empleado.Departamento?.Nombre,
            empleado.Cargo?.Nombre,
            turnoDto,
            asistenciaDto,
            marcasDto,
            accionSugerida
        );

        return Result<MiEstadoAsistenciaHoyDto>.Success(result);
    }
}
