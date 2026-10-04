namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Tipos de almacén en el modelo logístico de Servicio de Campo.
/// </summary>
public enum TipoAlmacen
{
    /// <summary>
    /// Almacén físico principal o secundario de la unidad organizativa (nave / bodega física).
    /// </summary>
    Bodega = 1,

    /// <summary>
    /// Material bajo responsabilidad de un técnico, independientemente de su transporte.
    /// </summary>
    CustodiaPersonal = 2
}
