namespace BubbaBag.Modules.Inventario.Domain.Productos;

/// <summary>
/// Discriminador de Producto en el ERP (alineado al estándar Microsoft Dynamics 365).
/// </summary>
public enum TipoProducto
{
    /// <summary>
    /// Bien tangible sujeto a control estricto de almacén, existencias, kardex y series (ej. Decodificador, Router, Antena).
    /// </summary>
    Inventario = 1,

    /// <summary>
    /// Bien o consumible menor sin seguimiento estricto de almacén (ej. cinta aislante, tornillos, canaletas menores).
    /// </summary>
    NoInventario = 2,

    /// <summary>
    /// Prestación de servicio técnico o mano de obra con checklist operativo (ej. Instalación DTH, Mantenimiento, Mudanza).
    /// </summary>
    Servicio = 3
}
