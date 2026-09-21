using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Inventario.Domain.Productos;

/// <summary>
/// Catálogo Maestro de Productos, Materiales y Servicios comercializables de la empresa.
/// </summary>
public class Producto : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public TipoProducto Tipo { get; private set; } = TipoProducto.Inventario;
    public decimal PrecioBase { get; private set; } = 0m;
    public Guid? CatalogoId { get; private set; } // Vinculación opcional a Empresa Contratante (DIRECTV, Claro, etc.)
    public string Categoria { get; private set; } = "Materiales"; // Materiales, Equipos, Insumos, Herramientas, Servicios
    public string UnidadMedida { get; private set; } = "Unidades"; // Unidades, Metros, Rollos, Cajas, Servicios
    public bool EsSerializado { get; private set; } // true para decos/routers con serie
    public bool Activo { get; private set; }

    private Producto() { }

    public static Producto Crear(
        string codigo,
        string nombre,
        string categoria = "Materiales",
        string unidadMedida = "Unidades",
        bool esSerializado = false,
        string? descripcion = null,
        TipoProducto tipo = TipoProducto.Inventario,
        decimal precioBase = 0m,
        Guid? catalogoId = null)
    {
        return new Producto
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Categoria = categoria.Trim(),
            UnidadMedida = unidadMedida.Trim(),
            EsSerializado = esSerializado,
            Descripcion = descripcion?.Trim(),
            Tipo = tipo,
            PrecioBase = Math.Max(0, precioBase),
            CatalogoId = catalogoId,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string categoria,
        string unidadMedida,
        bool esSerializado,
        string? descripcion,
        TipoProducto tipo = TipoProducto.Inventario,
        decimal precioBase = 0m,
        Guid? catalogoId = null)
    {
        Nombre = nombre.Trim();
        Categoria = categoria.Trim();
        UnidadMedida = unidadMedida.Trim();
        EsSerializado = esSerializado;
        Descripcion = descripcion?.Trim();
        Tipo = tipo;
        PrecioBase = Math.Max(0, precioBase);
        CatalogoId = catalogoId;
    }

    public void ActualizarPrecioBase(decimal nuevoPrecioBase)
    {
        PrecioBase = Math.Max(0, nuevoPrecioBase);
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
