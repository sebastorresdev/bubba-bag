using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Consolidado;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Marcaciones;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Marcaciones.Commands.RegistrarMarcacion;

public record RegistrarMarcacionCommand(
    Guid? EmpleadoId,
    int TipoMarca,
    int Origen = 2,
    string? FotoUrl = null,
    double? Latitud = null,
    double? Longitud = null,
    string? Observaciones = null
) : ICommand<Result<Guid>>;

public class RegistrarMarcacionHandler : ICommandHandler<RegistrarMarcacionCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public RegistrarMarcacionHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> HandleAsync(RegistrarMarcacionCommand request, CancellationToken cancellationToken)
    {
        // 1. Identificar al Empleado
        Guid empleadoId;
        if (request.EmpleadoId.HasValue && request.EmpleadoId.Value != Guid.Empty)
        {
            empleadoId = request.EmpleadoId.Value;
        }
        else
        {
            // Intentar buscar por el correo del usuario actual
            var email = _currentUser.Email;
            var emp = await _context.Empleados.FirstOrDefaultAsync(e => e.Email == email, cancellationToken);
            if (emp is null)
            {
                // Fallback para pruebas o admin: tomar el primer empleado activo
                emp = await _context.Empleados.FirstOrDefaultAsync(e => e.Estado == Domain.Empleados.EstadoEmpleado.Activo, cancellationToken);
            }
            if (emp is null)
            {
                return Result<Guid>.Failure("No se encontró una ficha de colaborador asociada a tu usuario para registrar la asistencia.");
            }
            empleadoId = emp.Id;
        }

        var empleado = await _context.Empleados
            .Include(e => e.Turno)
            .FirstOrDefaultAsync(e => e.Id == empleadoId, cancellationToken);

        if (empleado is null)
        {
            return Result<Guid>.Failure("El colaborador no existe.");
        }

        if (empleado.Estado != Domain.Empleados.EstadoEmpleado.Activo)
        {
            return Result<Guid>.Failure($"No se puede registrar asistencia porque el colaborador se encuentra en estado '{empleado.Estado}'.");
        }

        var ahoraUtc = DateTimeOffset.UtcNow;
        var ahoraPe = ahoraUtc.ToOffset(TimeSpan.FromHours(-5));
        var fechaOperativa = DateOnly.FromDateTime(ahoraPe.DateTime);

        var tipoMarcaEnum = (TipoMarca)request.TipoMarca;
        var origenEnum = (OrigenMarca)request.Origen;

        // 2. Registrar la Marca Cruda (Inmutable)
        var marca = new MarcacionCruda(
            Guid.NewGuid(),
            empleado.Id,
            ahoraUtc,
            tipoMarcaEnum,
            origenEnum,
            request.Latitud.HasValue ? MetodoAutenticacion.Geolocalizacion : MetodoAutenticacion.DniConPin,
            null,
            null,
            request.FotoUrl,
            request.Latitud,
            request.Longitud
        );

        _context.Marcaciones.Add(marca);

        // 3. Actualizar o Crear Asistencia Diaria Consolidada
        var asistencia = await _context.AsistenciasDiarias
            .FirstOrDefaultAsync(a => a.EmpleadoId == empleado.Id && a.FechaOperativa == fechaOperativa, cancellationToken);

        var turno = empleado.Turno;

        if (asistencia is null)
        {
            DateTime? horaEntradaProg = turno != null ? fechaOperativa.ToDateTime(turno.HoraInicio) : null;
            DateTime? horaSalidaProg = turno != null ? fechaOperativa.ToDateTime(turno.HoraFin) : null;

            asistencia = new AsistenciaDiaria(
                Guid.NewGuid(),
                empleado.Id,
                fechaOperativa,
                turno?.Id,
                horaEntradaProg,
                horaSalidaProg,
                null,
                null,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                EstadoAsistencia.Presente,
                false,
                request.Observaciones
            );

            _context.AsistenciasDiarias.Add(asistencia);
        }

        // Aplicar marca
        switch (tipoMarcaEnum)
        {
            case TipoMarca.Entrada:
                var estadoCalculado = EstadoAsistencia.Presente;
                int minutosTardanza = 0;

                if (turno != null)
                {
                    var tiempoEntrada = TimeOnly.FromTimeSpan(ahoraPe.TimeOfDay);
                    var limiteConTolerancia = turno.HoraInicio.AddMinutes(turno.MinutosToleranciaEntrada);

                    if (tiempoEntrada > limiteConTolerancia)
                    {
                        var diff = (tiempoEntrada.ToTimeSpan() - turno.HoraInicio.ToTimeSpan()).TotalMinutes;
                        minutosTardanza = (int)Math.Max(0, diff);
                        estadoCalculado = EstadoAsistencia.Tardanza;
                    }
                }

                asistencia.ActualizarCalculos(
                    horaEntradaReal: ahoraUtc,
                    horaSalidaReal: asistencia.HoraSalidaReal,
                    horaInicioRefrigerioReal: asistencia.HoraInicioRefrigerioReal,
                    horaFinRefrigerioReal: asistencia.HoraFinRefrigerioReal,
                    minutosTardanza: minutosTardanza,
                    minutosSalidaTemprana: asistencia.MinutosSalidaTemprana,
                    minutosExcesoRefrigerio: asistencia.MinutosExcesoRefrigerio,
                    horasTrabajadas: asistencia.HorasTrabajadas,
                    horasDiurnas: asistencia.HorasDiurnas,
                    horasNocturnas: asistencia.HorasNocturnas,
                    minutosHorasExtra: asistencia.MinutosHorasExtra,
                    estado: estadoCalculado,
                    observacion: request.Observaciones ?? asistencia.Observacion
                );
                break;

            case TipoMarca.InicioRefrigerio:
                asistencia.ActualizarCalculos(
                    horaEntradaReal: asistencia.HoraEntradaReal,
                    horaSalidaReal: asistencia.HoraSalidaReal,
                    horaInicioRefrigerioReal: ahoraUtc,
                    horaFinRefrigerioReal: asistencia.HoraFinRefrigerioReal,
                    minutosTardanza: asistencia.MinutosTardanza,
                    minutosSalidaTemprana: asistencia.MinutosSalidaTemprana,
                    minutosExcesoRefrigerio: asistencia.MinutosExcesoRefrigerio,
                    horasTrabajadas: asistencia.HorasTrabajadas,
                    horasDiurnas: asistencia.HorasDiurnas,
                    horasNocturnas: asistencia.HorasNocturnas,
                    minutosHorasExtra: asistencia.MinutosHorasExtra,
                    estado: asistencia.Estado,
                    observacion: request.Observaciones ?? asistencia.Observacion
                );
                break;

            case TipoMarca.FinRefrigerio:
                int excesoRefrigerio = 0;
                if (asistencia.HoraInicioRefrigerioReal.HasValue)
                {
                    var duracionMin = (ahoraUtc - asistencia.HoraInicioRefrigerioReal.Value).TotalMinutes;
                    var esperado = turno?.MinutosRefrigerio ?? 60;
                    var tolerancia = turno?.MinutosToleranciaRefrigerio ?? 5;
                    excesoRefrigerio = (int)Math.Max(0, duracionMin - (esperado + tolerancia));
                }

                asistencia.ActualizarCalculos(
                    horaEntradaReal: asistencia.HoraEntradaReal,
                    horaSalidaReal: asistencia.HoraSalidaReal,
                    horaInicioRefrigerioReal: asistencia.HoraInicioRefrigerioReal,
                    horaFinRefrigerioReal: ahoraUtc,
                    minutosTardanza: asistencia.MinutosTardanza,
                    minutosSalidaTemprana: asistencia.MinutosSalidaTemprana,
                    minutosExcesoRefrigerio: excesoRefrigerio,
                    horasTrabajadas: asistencia.HorasTrabajadas,
                    horasDiurnas: asistencia.HorasDiurnas,
                    horasNocturnas: asistencia.HorasNocturnas,
                    minutosHorasExtra: asistencia.MinutosHorasExtra,
                    estado: asistencia.Estado,
                    observacion: request.Observaciones ?? asistencia.Observacion
                );
                break;

            case TipoMarca.Salida:
                decimal netas = 0;
                if (asistencia.HoraEntradaReal.HasValue)
                {
                    var totalHoras = (decimal)(ahoraUtc - asistencia.HoraEntradaReal.Value).TotalHours;
                    var refrigerioHoras = (turno?.MinutosRefrigerio ?? 60) / 60m;
                    netas = Math.Round(Math.Max(0, totalHoras - refrigerioHoras), 2);
                }

                asistencia.ActualizarCalculos(
                    horaEntradaReal: asistencia.HoraEntradaReal,
                    horaSalidaReal: ahoraUtc,
                    horaInicioRefrigerioReal: asistencia.HoraInicioRefrigerioReal,
                    horaFinRefrigerioReal: asistencia.HoraFinRefrigerioReal,
                    minutosTardanza: asistencia.MinutosTardanza,
                    minutosSalidaTemprana: asistencia.MinutosSalidaTemprana,
                    minutosExcesoRefrigerio: asistencia.MinutosExcesoRefrigerio,
                    horasTrabajadas: netas,
                    horasDiurnas: netas,
                    horasNocturnas: 0,
                    minutosHorasExtra: asistencia.MinutosHorasExtra,
                    estado: asistencia.Estado,
                    observacion: request.Observaciones ?? asistencia.Observacion
                );
                break;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(marca.Id);
    }
}
