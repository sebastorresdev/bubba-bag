namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Método de cálculo para la determinación del precio en un elemento de lista de precios.
/// Basado en el estándar de fijación de precios de Microsoft Dynamics 365.
/// </summary>
public enum MetodoFijacionPrecio
{
    ImporteDivisa = 1,          // Currency Amount (Precio fijo directo en la divisa de la lista)
    PorcentajeSobreCosto = 2,    // % Markup over Cost (Margen sobre el costo actual o estándar)
    PorcentajeMargen = 3         // % Margin
}
