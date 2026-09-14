namespace BubbaBag.Modules.ServicioCampo.Domain.Enums;

/// <summary>
/// Estados estandarizados de ciclo de vida de la Orden de Trabajo.
/// Refleja la coordinación integral entre Despacho, Campo, Almacén y Finanzas.
/// </summary>
public enum EstadoOrdenTrabajo
{
    /// <summary>
    /// Registrada o importada en sistema, pendiente de agendar visita inicial.
    /// </summary>
    Pendiente = 1,

    /// <summary>
    /// Tiene al menos una visita agendada en calendario con técnico y bloque horario.
    /// </summary>
    Programada = 2,

    /// <summary>
    /// Cuadrilla/Técnico se encuentra físicamente en el domicilio ejecutando labores.
    /// </summary>
    EnProgreso = 3,

    /// <summary>
    /// La visita fue interrumpida o no completada en sitio; requiere revisión y coordinación de nueva cita.
    /// </summary>
    Rechazada = 4,

    /// <summary>
    /// Labor física en campo terminada; retenida a la espera de regularización de materiales o subida de evidencias.
    /// </summary>
    Completa = 5,

    /// <summary>
    /// Evidencias validadas y descarga de materiales confirmada en inventario de bodega.
    /// </summary>
    Finalizada = 6,

    /// <summary>
    /// Liquidación contable procesada y autorizada para pago de tarifas/comisiones.
    /// </summary>
    Liquidada = 7,

    /// <summary>
    /// Anulación definitiva de la orden por desistimiento o inviabilidad contractual.
    /// </summary>
    Cancelada = 8
}
