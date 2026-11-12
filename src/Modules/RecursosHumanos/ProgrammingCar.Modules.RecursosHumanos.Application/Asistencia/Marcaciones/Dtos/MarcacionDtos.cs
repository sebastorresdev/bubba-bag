using System;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Marcaciones.Dtos;

public record MarcacionDto(
    Guid Id,
    Guid EmpleadoId,
    string EmpleadoNombre,
    DateTimeOffset FechaHora,
    int TipoMarca,
    string TipoMarcaNombre,
    int Origen,
    string OrigenNombre,
    string? FotoUrl,
    double? Latitud,
    double? Longitud,
    bool EsValida
);

public record AsistenciaDiariaDto(
    Guid Id,
    Guid EmpleadoId,
    string EmpleadoNombre,
    string Documento,
    string FechaOperativa,
    Guid? TurnoId,
    string? TurnoNombre,
    string? HoraEntradaProgramada,
    string? HoraSalidaProgramada,
    string? HoraEntradaReal,
    string? HoraSalidaReal,
    string? HoraInicioRefrigerioReal,
    string? HoraFinRefrigerioReal,
    int MinutosTardanza,
    int MinutosExcesoRefrigerio,
    decimal HorasTrabajadas,
    int Estado,
    string EstadoNombre,
    string? Observacion
);

public record MiEstadoAsistenciaHoyDto(
    Guid EmpleadoId,
    string EmpleadoNombre,
    string Documento,
    string? Departamento,
    string? Cargo,
    Turnos.Dtos.TurnoDto? Turno,
    AsistenciaDiariaDto? AsistenciaHoy,
    System.Collections.Generic.List<MarcacionDto> MarcacionesHoy,
    string SiguienteAccionSugerida
);
