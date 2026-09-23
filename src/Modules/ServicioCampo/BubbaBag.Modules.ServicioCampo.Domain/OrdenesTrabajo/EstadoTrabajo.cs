namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Estado del ciclo de vida operativo de un Trabajo dentro de una Orden de Trabajo.
/// </summary>
public enum EstadoTrabajo
{
    Pendiente = 1,
    EnProgreso = 2,
    Completado = 3,
    Cancelado = 4,
    Rechazado = 5
}
