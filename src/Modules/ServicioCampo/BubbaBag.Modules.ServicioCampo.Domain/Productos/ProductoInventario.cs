using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Representa productos físicos tangibles que la empresa almacena y despacha.
/// Referencia a ProductoComercial como su padre conceptual.
/// No tiene campos de servicio ni duración.
/// No se mezcla con Servicio.
/// </summary>
public class ProductoInventario : Entity<Guid>
{
    /// <summary>
    /// Referencia conceptual a ProductoComercial (el padre comercial).
    /// </summary>
    public Guid ProductoComercialId { get; private set; }

    /// <summary>
    /// Unidad de medida para control y movimientos de existencias (ej: "Unidades", "Metros", "Rollos", "Cajas").
    /// </summary>
    public string UnidadMedida { get; private set; } = "Unidades";

    /// <summary>
    /// Clasificación de almacenamiento físico (ej: "Equipos", "Ferretería", "Insumos", "Herramientas").
    /// </summary>
    public string CategoriaAlmacen { get; private set; } = "Materiales";

    /// <summary>
    /// Indica si el producto físico requiere control por número de serie o MAC unitario (ej: Decodificadores, Routers).
    /// </summary>
    public bool EsSerializado { get; private set; }

    /// <summary>
    /// Cantidad umbral mínima para alertas de reabastecimiento en almacén.
    /// </summary>
    public decimal StockMinimoAlerta { get; private set; } = 0m;

    public bool Activo { get; private set; }

    private ProductoInventario() { }

    public static ProductoInventario Crear(
        Guid productoComercialId,
        string unidadMedida = "Unidades",
        string categoriaAlmacen = "Materiales",
        bool esSerializado = false,
        decimal stockMinimoAlerta = 0m)
    {
        return new ProductoInventario
        {
            Id = Guid.NewGuid(),
            ProductoComercialId = productoComercialId,
            UnidadMedida = unidadMedida.Trim(),
            CategoriaAlmacen = categoriaAlmacen.Trim(),
            EsSerializado = esSerializado,
            StockMinimoAlerta = Math.Max(0, stockMinimoAlerta),
            Activo = true
        };
    }

    public void Actualizar(
        string unidadMedida,
        string categoriaAlmacen,
        bool esSerializado,
        decimal stockMinimoAlerta)
    {
        UnidadMedida = unidadMedida.Trim();
        CategoriaAlmacen = categoriaAlmacen.Trim();
        EsSerializado = esSerializado;
        StockMinimoAlerta = Math.Max(0, stockMinimoAlerta);
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
