using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

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
    public Guid? ListaPreciosPredeterminadaId { get; private set; } // Default Price List (Field Service / Sales)
    public virtual ListaPrecios? ListaPreciosPredeterminada { get; private set; }
    public virtual ICollection<ElementoListaPrecios> PreciosEnListas { get; private set; } = new List<ElementoListaPrecios>();
    public string? Categoria { get; private set; } // Materiales, Equipos, Insumos, Herramientas, Servicios
    public string UnidadMedida { get; private set; } = "Unidades"; // Unidades, Metros, Rollos, Cajas, Servicios
    public bool EsSerializado { get; private set; } // true para decos/routers con serie
    public bool ConvertirEnActivoCliente { get; private set; } = false; // Convert to Customer Asset (Field Service)
    public string? CodigoBarras { get; private set; } // UPC Code / Barcode
    public string? Notas { get; private set; } // Notas internas y especificaciones
    public decimal CostoActual { get; private set; } = 0m; // Current Cost
    public decimal CostoEstandar { get; private set; } = 0m; // Standard Cost
    public bool AfectoImpuesto { get; private set; } = true; // Taxable / Afecto a IGV
    public string? ProveedorDefecto { get; private set; } // Default Vendor
    public bool Activo { get; private set; }

    private Producto() { }

    public static Producto Crear(
        string codigo,
        string nombre,
        string? categoria = null,
        string unidadMedida = "Unidades",
        bool esSerializado = false,
        string? descripcion = null,
        TipoProducto tipo = TipoProducto.Inventario,
        decimal precioBase = 0m,
        Guid? catalogoId = null,
        bool convertirEnActivoCliente = false,
        string? codigoBarras = null,
        string? notas = null,
        decimal costoActual = 0m,
        decimal costoEstandar = 0m,
        bool afectoImpuesto = true,
        string? proveedorDefecto = null,
        Guid? listaPreciosPredeterminadaId = null)
    {
        return new Producto
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Categoria = string.IsNullOrWhiteSpace(categoria) ? null : categoria.Trim(),
            UnidadMedida = unidadMedida.Trim(),
            EsSerializado = esSerializado,
            Descripcion = descripcion?.Trim(),
            Tipo = tipo,
            PrecioBase = Math.Max(0, precioBase),
            CatalogoId = catalogoId,
            ListaPreciosPredeterminadaId = listaPreciosPredeterminadaId,
            ConvertirEnActivoCliente = convertirEnActivoCliente,
            CodigoBarras = codigoBarras?.Trim(),
            Notas = notas?.Trim(),
            CostoActual = Math.Max(0, costoActual),
            CostoEstandar = Math.Max(0, costoEstandar),
            AfectoImpuesto = afectoImpuesto,
            ProveedorDefecto = proveedorDefecto?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string? categoria,
        string unidadMedida,
        bool esSerializado,
        string? descripcion,
        TipoProducto tipo = TipoProducto.Inventario,
        decimal precioBase = 0m,
        Guid? catalogoId = null,
        bool convertirEnActivoCliente = false,
        string? codigoBarras = null,
        string? notas = null,
        decimal costoActual = 0m,
        decimal costoEstandar = 0m,
        bool afectoImpuesto = true,
        string? proveedorDefecto = null,
        Guid? listaPreciosPredeterminadaId = null)
    {
        Nombre = nombre.Trim();
        Categoria = string.IsNullOrWhiteSpace(categoria) ? null : categoria.Trim();
        UnidadMedida = unidadMedida.Trim();
        EsSerializado = esSerializado;
        Descripcion = descripcion?.Trim();
        Tipo = tipo;
        PrecioBase = Math.Max(0, precioBase);
        CatalogoId = catalogoId;
        ListaPreciosPredeterminadaId = listaPreciosPredeterminadaId;
        ConvertirEnActivoCliente = convertirEnActivoCliente;
        CodigoBarras = codigoBarras?.Trim();
        Notas = notas?.Trim();
        CostoActual = Math.Max(0, costoActual);
        CostoEstandar = Math.Max(0, costoEstandar);
        AfectoImpuesto = afectoImpuesto;
        ProveedorDefecto = proveedorDefecto?.Trim();
    }

    public void ActualizarPrecioBase(decimal nuevoPrecioBase)
    {
        PrecioBase = Math.Max(0, nuevoPrecioBase);
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
