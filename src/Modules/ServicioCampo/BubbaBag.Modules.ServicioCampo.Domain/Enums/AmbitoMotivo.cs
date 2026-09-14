namespace BubbaBag.Modules.ServicioCampo.Domain.Enums;

/// <summary>
/// Ámbito o alcance de aplicación de un motivo de cancelación o rechazo.
/// </summary>
public enum AmbitoMotivo
{
    /// <summary>
    /// Motivos aplicables a la cancelación o interrupción de una Visita en campo.
    /// Ej: 'Cliente ausente', 'Lluvia torrencial', 'Acceso denegado'.
    /// </summary>
    Visita = 1,

    /// <summary>
    /// Motivos aplicables a la cancelación definitiva o rechazo de una Orden de Trabajo.
    /// Ej: 'Cliente desiste de contrato', 'Inviabilidad técnica definitiva', 'Orden duplicada'.
    /// </summary>
    OrdenTrabajo = 2,

    /// <summary>
    /// Motivos aplicables al rechazo de una subtarea técnica específica.
    /// Ej: 'Cliente no desea punto adicional', 'Ductería obstruida'.
    /// </summary>
    Tarea = 3
}
