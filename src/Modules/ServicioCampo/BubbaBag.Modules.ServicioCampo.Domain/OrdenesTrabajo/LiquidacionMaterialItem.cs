using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Línea de detalle de la descarga o liquidación final de materiales de una Orden de Trabajo.
/// Refleja la cantidad física consolidada a descontar o reingresar al almacén / camioneta.
/// </summary>
public class LiquidacionMaterialItem : Entity<Guid>
{
    public Guid LiquidacionMaterialId { get; private set; }
    public LiquidacionMaterial LiquidacionMaterial { get; private set; } = default!;

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    /// <summary>
    /// Cantidad física total consumida/instalada en la orden que se rebaja del stock de custodia.
    /// </summary>
    public decimal CantidadConsumida { get; private set; }

    /// <summary>
    /// Cantidad no utilizada que se devuelve físicamente al almacén principal.
    /// </summary>
    public decimal CantidadDevuelta { get; private set; }

    public bool EsSeriado { get; private set; }
    public Guid? ItemSeriadoId { get; private set; }
    public string? NumeroSerie { get; private set; }

    /// <summary>
    /// Indica si el ítem corresponde a un equipo recuperado / retirado del cliente para retorno a laboratorio o baja.
    /// </summary>
    public bool EsRetiro { get; private set; }

    public string? Observaciones { get; private set; }

    private LiquidacionMaterialItem() { }

    public static LiquidacionMaterialItem Crear(
        Guid liquidacionMaterialId,
        Guid productoId,
        decimal cantidadConsumida,
        decimal cantidadDevuelta = 0m,
        bool esSeriado = false,
        Guid? itemSeriadoId = null,
        string? numeroSerie = null,
        bool esRetiro = false,
        string? observaciones = null)
    {
        return new LiquidacionMaterialItem
        {
            Id = Guid.NewGuid(),
            LiquidacionMaterialId = liquidacionMaterialId,
            ProductoId = productoId,
            CantidadConsumida = Math.Max(0, cantidadConsumida),
            CantidadDevuelta = Math.Max(0, cantidadDevuelta),
            EsSeriado = esSeriado,
            ItemSeriadoId = itemSeriadoId,
            NumeroSerie = numeroSerie?.Trim().ToUpperInvariant(),
            EsRetiro = esRetiro,
            Observaciones = observaciones?.Trim()
        };
    }
}
