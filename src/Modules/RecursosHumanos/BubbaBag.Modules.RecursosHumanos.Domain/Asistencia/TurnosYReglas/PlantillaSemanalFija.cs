using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;

public class PlantillaSemanalFija : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    /// <summary>
    /// 1 = Lunes, 2 = Martes, ..., 7 = Domingo (ISO 8601)
    /// </summary>
    public DayOfWeek DiaSemana { get; private set; }

    public Guid? TurnoId { get; private set; }
    public Turno? Turno { get; private set; }

    public bool EsDescanso { get; private set; }

    private PlantillaSemanalFija() { }

    public PlantillaSemanalFija(Guid id, Guid empleadoId, DayOfWeek diaSemana, Guid? turnoId, bool esDescanso = false)
    {
        Id = id;
        EmpleadoId = empleadoId;
        DiaSemana = diaSemana;
        TurnoId = esDescanso ? null : turnoId;
        EsDescanso = esDescanso || turnoId == null;
    }

    public void AsignarTurno(Guid? turnoId, bool esDescanso)
    {
        TurnoId = esDescanso ? null : turnoId;
        EsDescanso = esDescanso || turnoId == null;
    }
}
