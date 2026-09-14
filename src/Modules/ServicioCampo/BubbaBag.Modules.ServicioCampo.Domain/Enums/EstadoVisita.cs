namespace BubbaBag.Modules.ServicioCampo.Domain.Enums;

/// <summary>
/// Estados de ciclo de vida de cada visita o despacho físico al cliente.
/// </summary>
public enum EstadoVisita
{
    /// <summary>
    /// Visita agendada con fecha, bloque horario y técnico asignado.
    /// </summary>
    Programada = 1,

    /// <summary>
    /// El técnico inició su desplazamiento hacia el domicilio del cliente.
    /// </summary>
    EnCamino = 2,

    /// <summary>
    /// El técnico llegó al predio e inició la atención técnica presencial.
    /// </summary>
    EnCurso = 3,

    /// <summary>
    /// La visita concluyó con éxito, registrando tareas y evidencias.
    /// </summary>
    Completada = 4,

    /// <summary>
    /// La visita fue cancelada antes de iniciar o interrumpida en sitio por fuerza mayor/cliente.
    /// </summary>
    Cancelada = 5,

    /// <summary>
    /// Concluyó la jornada y la visita no fue atendida ni reportada por la cuadrilla.
    /// </summary>
    Vencida = 6
}
