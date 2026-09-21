using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Ventas.Domain.ProductosComerciales;

/// <summary>
/// Representa cualquier cosa que la empresa comercializa y vende.
/// Puede ser de tipo Servicio o Inventario.
/// Es la base conceptual para listas de precios, cotizaciones y facturas.
/// No contiene información operativa ni de stock.
/// No debe tener campos específicos de servicios ni de inventario.
/// Es el padre conceptual de los demás tipos.
/// No referencia a Servicio ni a ProductoInventario; ellos lo referencian a él.
/// </summary>
public class ProductoComercial : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    /// <summary>
    /// Clasificador comercial (Servicio o Inventario).
    /// </summary>
    public TipoProductoComercial Tipo { get; private set; }

    /// <summary>
    /// Precio base de lista referencial para ventas.
    /// </summary>
    public decimal PrecioBase { get; private set; } = 0m;

    /// <summary>
    /// Catálogo comercial al que pertenece este producto.
    /// </summary>
    public Guid CatalogoProductoComercialId { get; private set; }
    public CatalogoProductoComercial CatalogoProductoComercial { get; private set; } = default!;

    public bool Activo { get; private set; }

    private ProductoComercial() { }

    public static ProductoComercial Crear(
        string codigo,
        string nombre,
        TipoProductoComercial tipo,
        Guid catalogoProductoComercialId,
        decimal precioBase = 0m,
        string? descripcion = null)
    {
        return new ProductoComercial
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Tipo = tipo,
            CatalogoProductoComercialId = catalogoProductoComercialId,
            PrecioBase = Math.Max(0, precioBase),
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        Guid catalogoProductoComercialId,
        decimal precioBase,
        string? descripcion)
    {
        Nombre = nombre.Trim();
        CatalogoProductoComercialId = catalogoProductoComercialId;
        PrecioBase = Math.Max(0, precioBase);
        Descripcion = descripcion?.Trim();
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
