using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.PerfilYAsignacion;

public class ProgramacionHorario : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public DateOnly FechaOperativa { get; private set; }

    public Guid? TurnoId { get; private set; }
    public Turno? Turno { get; private set; }

    public bool EsDescanso { get; private set; }

    // Auditoría de modificaciones manuales de supervisores
    public bool EsModificadoManualmente { get; private set; }
    public Guid? ModificadoPorId { get; private set; }
    public string? Observacion { get; private set; }

    private ProgramacionHorario() { }

    public ProgramacionHorario(
        Guid id,
        Guid empleadoId,
        DateOnly fechaOperativa,
        Guid? turnoId,
        bool esDescanso = false,
        bool esModificadoManualmente = false,
        Guid? modificadoPorId = null,
        string? observacion = null)
    {
        Id = id;
        EmpleadoId = empleadoId;
        FechaOperativa = fechaOperativa;
        TurnoId = esDescanso ? null : turnoId;
        EsDescanso = esDescanso || turnoId == null;
        EsModificadoManualmente = esModificadoManualmente;
        ModificadoPorId = modificadoPorId;
        Observacion = observacion?.Trim();
    }

    /// <summary>
    /// Permite al supervisor sobreescribir el turno de un día programado.
    /// </summary>
    public void ModificarManualmente(Guid? nuevoTurnoId, bool esDescanso, Guid modificadoPorId, string? observacion)
    {
        TurnoId = esDescanso ? null : nuevoTurnoId;
        EsDescanso = esDescanso || nuevoTurnoId == null;
        EsModificadoManualmente = true;
        ModificadoPorId = modificadoPorId;
        Observacion = observacion?.Trim();
    }
}
