using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;

public class PatronCiclicoDetalle : Entity<Guid>
{
    public Guid PatronCiclicoId { get; private set; }
    public PatronCiclico PatronCiclico { get; private set; } = default!;

    public int DiaOrden { get; private set; }
    public Guid? TurnoId { get; private set; }
    public Turno? Turno { get; private set; }
    public bool EsDescanso { get; private set; }

    private PatronCiclicoDetalle() { }

    public PatronCiclicoDetalle(Guid id, Guid patronCiclicoId, int diaOrden, Guid? turnoId, bool esDescanso = false)
    {
        Id = id;
        PatronCiclicoId = patronCiclicoId;
        DiaOrden = diaOrden;
        TurnoId = esDescanso ? null : turnoId;
        EsDescanso = esDescanso || turnoId == null;
    }

    public void Actualizar(Guid? turnoId, bool esDescanso)
    {
        TurnoId = esDescanso ? null : turnoId;
        EsDescanso = esDescanso || turnoId == null;
    }
}
