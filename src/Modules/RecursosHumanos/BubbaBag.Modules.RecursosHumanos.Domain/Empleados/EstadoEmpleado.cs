using System.Text.Json.Serialization;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Empleados;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EstadoEmpleado
{
    /// <summary>
    /// Colaborador laborando con normalidad.
    /// </summary>
    Activo = 1,

    /// <summary>
    /// En goce de descanso vacacional programado.
    /// </summary>
    Vacaciones = 2,

    /// <summary>
    /// Con licencia médica, maternidad/paternidad o permiso especial.
    /// </summary>
    Licencia = 3,

    /// <summary>
    /// Suspensión temporal disciplinaria o de ley.
    /// </summary>
    Suspendido = 4,

    /// <summary>
    /// Relación laboral culminada (baja / cese).
    /// </summary>
    Cesado = 5
}
