using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Consolidado;

/// <summary>
/// Representa el resultado final consolidado del día para el empleado (usado en reportes y nómina).
/// </summary>
public class AsistenciaDiaria : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public DateOnly FechaOperativa { get; private set; }

    public Guid? TurnoId { get; private set; }
    public Turno? Turno { get; private set; }

    // Horas programadas teóricas
    public DateTime? HoraEntradaProgramada { get; private set; }
    public DateTime? HoraSalidaProgramada { get; private set; }

    // Horas reales capturadas
    public DateTimeOffset? HoraEntradaReal { get; private set; }
    public DateTimeOffset? HoraSalidaReal { get; private set; }
    public DateTimeOffset? HoraInicioRefrigerioReal { get; private set; }
    public DateTimeOffset? HoraFinRefrigerioReal { get; private set; }

    // Métricas de puntualidad
    public int MinutosTardanza { get; private set; } = 0;
    public int MinutosSalidaTemprana { get; private set; } = 0;
    public int MinutosExcesoRefrigerio { get; private set; } = 0;

    // Desglose de horas trabajadas para planilla
    public decimal HorasTrabajadas { get; private set; } = 0;
    public decimal HorasDiurnas { get; private set; } = 0;
    public decimal HorasNocturnas { get; private set; } = 0;

    // Horas extras
    public int MinutosHorasExtra { get; private set; } = 0;
    public bool HorasExtraAprobadas { get; private set; } = false;

    // Estado del día
    public EstadoAsistencia Estado { get; private set; } = EstadoAsistencia.Presente;
    public bool Aprobado { get; private set; } = false;
    public bool EsGeneradoAutomaticamente { get; private set; } = false;
    public string? Observacion { get; private set; }

    private AsistenciaDiaria() { }

    public AsistenciaDiaria(
        Guid id,
        Guid empleadoId,
        DateOnly fechaOperativa,
        Guid? turnoId,
        DateTime? horaEntradaProgramada,
        DateTime? horaSalidaProgramada,
        DateTimeOffset? horaEntradaReal,
        DateTimeOffset? horaSalidaReal,
        int minutosTardanza,
        int minutosSalidaTemprana,
        int minutosExcesoRefrigerio,
        decimal horasTrabajadas,
        decimal horasDiurnas,
        decimal horasNocturnas,
        int minutosHorasExtra,
        EstadoAsistencia estado,
        bool esGeneradoAutomaticamente = false,
        string? observacion = null)
    {
        Id = id;
        EmpleadoId = empleadoId;
        FechaOperativa = fechaOperativa;
        TurnoId = turnoId;
        HoraEntradaProgramada = horaEntradaProgramada;
        HoraSalidaProgramada = horaSalidaProgramada;
        HoraEntradaReal = horaEntradaReal;
        HoraSalidaReal = horaSalidaReal;
        MinutosTardanza = Math.Max(0, minutosTardanza);
        MinutosSalidaTemprana = Math.Max(0, minutosSalidaTemprana);
        MinutosExcesoRefrigerio = Math.Max(0, minutosExcesoRefrigerio);
        HorasTrabajadas = Math.Max(0, horasTrabajadas);
        HorasDiurnas = Math.Max(0, horasDiurnas);
        HorasNocturnas = Math.Max(0, horasNocturnas);
        MinutosHorasExtra = Math.Max(0, minutosHorasExtra);
        Estado = estado;
        EsGeneradoAutomaticamente = esGeneradoAutomaticamente;
        Observacion = observacion?.Trim();
        Aprobado = false;
    }

    public void ActualizarCalculos(
        DateTimeOffset? horaEntradaReal,
        DateTimeOffset? horaSalidaReal,
        DateTimeOffset? horaInicioRefrigerioReal,
        DateTimeOffset? horaFinRefrigerioReal,
        int minutosTardanza,
        int minutosSalidaTemprana,
        int minutosExcesoRefrigerio,
        decimal horasTrabajadas,
        decimal horasDiurnas,
        decimal horasNocturnas,
        int minutosHorasExtra,
        EstadoAsistencia estado,
        string? observacion = null)
    {
        HoraEntradaReal = horaEntradaReal;
        HoraSalidaReal = horaSalidaReal;
        HoraInicioRefrigerioReal = horaInicioRefrigerioReal;
        HoraFinRefrigerioReal = horaFinRefrigerioReal;
        MinutosTardanza = Math.Max(0, minutosTardanza);
        MinutosSalidaTemprana = Math.Max(0, minutosSalidaTemprana);
        MinutosExcesoRefrigerio = Math.Max(0, minutosExcesoRefrigerio);
        HorasTrabajadas = Math.Max(0, horasTrabajadas);
        HorasDiurnas = Math.Max(0, horasDiurnas);
        HorasNocturnas = Math.Max(0, horasNocturnas);
        MinutosHorasExtra = Math.Max(0, minutosHorasExtra);
        Estado = estado;
        if (!string.IsNullOrWhiteSpace(observacion))
        {
            Observacion = observacion.Trim();
        }
    }

    public void AprobarHorasExtra(bool aprobadas)
    {
        HorasExtraAprobadas = aprobadas;
    }

    public void AprobarAsistencia(bool aprobado)
    {
        Aprobado = aprobado;
    }
}
