namespace BubbaBag.Modules.Ventas.Domain.ProductosComerciales;

/// <summary>
/// Tipo o naturaleza del producto comercial para su tratamiento en el catálogo y listas de precios.
/// </summary>
public enum TipoProductoComercial
{
    /// <summary>
    /// Prestación de servicio técnico o mano de obra intangible.
    /// </summary>
    Servicio = 1,

    /// <summary>
    /// Bien tangible físico sujeto a control de inventario y almacén.
    /// </summary>
    Inventario = 2
}
