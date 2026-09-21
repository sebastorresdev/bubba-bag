using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Ventas.Domain.ListasPrecio;

/// <summary>
/// Ítem de Lista de Precios. Asigna un precio o tarifa pactada exclusivamente a un ProductoComercial.
/// Nunca referencia directamente a Servicio ni a ProductoInventario.
/// </summary>
public class ListaPrecioItem : Entity<Guid>
{
    public Guid ListaPrecioId { get; private set; }

    /// <summary>
    /// Referencia obligatoria al ProductoComercial base.
    /// </summary>
    public Guid ProductoComercialId { get; private set; }

    public Guid ProductoId => ProductoComercialId;

    public decimal PrecioUnitario { get; private set; }

    private ListaPrecioItem() { }

    internal static ListaPrecioItem Crear(Guid listaPrecioId, Guid productoComercialId, decimal precioUnitario)
    {
        return new ListaPrecioItem
        {
            Id = Guid.NewGuid(),
            ListaPrecioId = listaPrecioId,
            ProductoComercialId = productoComercialId,
            PrecioUnitario = Math.Max(0, precioUnitario)
        };
    }

    internal void ActualizarPrecio(decimal nuevoPrecio)
    {
        PrecioUnitario = Math.Max(0, nuevoPrecio);
    }
}
