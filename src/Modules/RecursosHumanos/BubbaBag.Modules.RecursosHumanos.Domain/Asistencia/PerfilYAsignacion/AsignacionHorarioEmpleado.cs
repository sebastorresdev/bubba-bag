using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.PerfilYAsignacion;

public class AsignacionHorarioEmpleado : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public TipoEsquemaLaboral TipoEsquema { get; private set; } = TipoEsquemaLaboral.FijoSemanal;

    // Solo requerido si TipoEsquema == RotativoCiclico
    public Guid? PatronCiclicoId { get; private set; }
    public PatronCiclico? PatronCiclico { get; private set; }

    public DateOnly FechaInicio { get; private set; }
    public DateOnly? FechaFin { get; private set; }

    /// <summary>
    /// Fecha de anclaje (día 1 del ciclo) para calcular la fase del patrón rotativo.
    /// </summary>
    public DateOnly? FechaInicioCiclo { get; private set; }

    public bool Activo { get; private set; } = true;

    private AsignacionHorarioEmpleado() { }

    public AsignacionHorarioEmpleado(
        Guid id,
        Guid empleadoId,
        TipoEsquemaLaboral tipoEsquema,
        DateOnly fechaInicio,
        DateOnly? fechaFin = null,
        Guid? patronCiclicoId = null,
        DateOnly? fechaInicioCiclo = null)
    {
        Id = id;
        EmpleadoId = empleadoId;
        TipoEsquema = tipoEsquema;
        FechaInicio = fechaInicio;
        FechaFin = fechaFin;
        PatronCiclicoId = tipoEsquema == TipoEsquemaLaboral.RotativoCiclico ? patronCiclicoId : null;
        FechaInicioCiclo = tipoEsquema == TipoEsquemaLaboral.RotativoCiclico ? (fechaInicioCiclo ?? fechaInicio) : null;
        Activo = true;
    }

    public void CerrarVigencia(DateOnly fechaFin)
    {
        FechaFin = fechaFin;
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
    }
}
