using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Ventas.Domain.ProductosComerciales;

/// <summary>
/// Única entidad que representa cualquier catálogo comercial de la empresa.
/// Agrupa exclusivamente productos comerciales (ProductoComercial).
/// Nunca referencia directamente a Servicio ni a ProductoInventario.
/// La empresa decide cuántos catálogos crear y cómo agruparlos libremente
/// (por proveedor, cliente, marca, línea de negocio, tipo comercial, etc.).
/// </summary>
public class CatalogoProductoComercial : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    /// <summary>
    /// Criterio empresarial libre de agrupación (ej. "Por Proveedor", "Por Línea de Producto", "Por Marca", "Por Cliente").
    /// El sistema no impone restricciones sobre este criterio.
    /// </summary>
    public string? CriterioAgrupacion { get; private set; }

    /// <summary>
    /// Identificador opcional de la entidad comercial vinculada si aplica (ej. Cliente corporativo o Proveedor).
    /// </summary>
    public Guid? EntidadComercialId { get; private set; }

    public bool Activo { get; private set; }

    // Agrupa exclusivamente referencias a ProductoComercial
    private readonly List<ProductoComercial> _productos = new();
    public IReadOnlyCollection<ProductoComercial> Productos => _productos.AsReadOnly();

    private CatalogoProductoComercial() { }

    public static CatalogoProductoComercial Crear(
        string codigo,
        string nombre,
        string? descripcion = null,
        string? criterioAgrupacion = null,
        Guid? entidadComercialId = null)
    {
        return new CatalogoProductoComercial
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Descripcion = descripcion?.Trim(),
            CriterioAgrupacion = criterioAgrupacion?.Trim(),
            EntidadComercialId = entidadComercialId,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string? descripcion,
        string? criterioAgrupacion,
        Guid? entidadComercialId)
    {
        Nombre = nombre.Trim();
        Descripcion = descripcion?.Trim();
        CriterioAgrupacion = criterioAgrupacion?.Trim();
        EntidadComercialId = entidadComercialId;
    }

    public void AgregarProducto(ProductoComercial producto)
    {
        if (producto == null) throw new ArgumentNullException(nameof(producto));
        if (!_productos.Exists(p => p.Id == producto.Id))
        {
            _productos.Add(producto);
        }
    }

    public void RemoverProducto(Guid productoId)
    {
        _productos.RemoveAll(p => p.Id == productoId);
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
