namespace BubbaBag.Modules.ServicioCampo.Domain.Enums;

/// <summary>
/// Estados de las subtareas técnicas de una Orden de Trabajo.
/// </summary>
public enum EstadoTarea
{
    /// <summary>
    /// Lista para ser ejecutada durante la visita.
    /// </summary>
    Abierta = 1,

    /// <summary>
    /// Ejecutada con éxito en campo.
    /// </summary>
    Completa = 2,

    /// <summary>
    /// Anulada formalmente (no se atenderá).
    /// </summary>
    Cancelada = 3,

    /// <summary>
    /// Rechazada en sitio por inviabilidad técnica o desistimiento puntual del cliente.
    /// </summary>
    Rechazada = 4,

    /// <summary>
    /// En ejecución activa por el técnico en sitio.
    /// </summary>
    EnProgreso = 5
}
