using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Consolidado;

public class BancoHorasMovimiento : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public DateOnly Fecha { get; private set; }
    public TipoMovimientoBancoHoras TipoMovimiento { get; private set; }

    /// <summary>
    /// Minutos que se suman o se restan.
    /// </summary>
    public int Minutos { get; private set; }

    public int SaldoResultante { get; private set; }

    public Guid? AsistenciaDiariaId { get; private set; }
    public AsistenciaDiaria? AsistenciaDiaria { get; private set; }

    public string? Observacion { get; private set; }
    public DateTime FechaCreacion { get; private set; } = DateTime.UtcNow;

    private BancoHorasMovimiento() { }

    public BancoHorasMovimiento(
        Guid id,
        Guid empleadoId,
        DateOnly fecha,
        TipoMovimientoBancoHoras tipoMovimiento,
        int minutos,
        int saldoResultante,
        Guid? asistenciaDiariaId = null,
        string? observacion = null)
    {
        Id = id;
        EmpleadoId = empleadoId;
        Fecha = fecha;
        TipoMovimiento = tipoMovimiento;
        Minutos = minutos;
        SaldoResultante = saldoResultante;
        AsistenciaDiariaId = asistenciaDiariaId;
        Observacion = observacion?.Trim();
        FechaCreacion = DateTime.UtcNow;
    }
}
