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
    public Guid? ListaPreciosPredeterminadaId { get; private set; } // Default Price List (Field Service / Sales)
    public virtual ListaPrecios? ListaPreciosPredeterminada { get; private set; }
    public virtual ICollection<ElementoListaPrecios> PreciosEnListas { get; private set; } = new List<ElementoListaPrecios>();
    public Guid? CategoriaProductoId { get; private set; }
    public virtual CategoriaProducto? CategoriaProducto { get; private set; }

    // ── Grupo de Unidades de Medida (familia permitida para este producto) ──
    public Guid? GrupoUnidadMedidaId { get; private set; }
    public virtual GrupoUnidadMedida? GrupoUnidadMedida { get; private set; }

    // ── Unidad de Medida predeterminada (debe pertenecer al grupo anterior) ──
    public Guid? UnidadMedidaDefectoId { get; private set; }
    public virtual UnidadMedida? UnidadMedidaDefecto { get; private set; }

    public int DecimalesCantidad { get; private set; }
    public bool EsSerializado { get; private set; } // true para decos/routers con serie
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
        Guid? categoriaProductoId = null,
        Guid? grupoUnidadMedidaId = null,
        Guid? unidadMedidaDefectoId = null,
        bool esSerializado = false,
        string? descripcion = null,
        TipoProducto tipo = TipoProducto.Inventario,
        decimal precioBase = 0m,
        string? codigoBarras = null,
        string? notas = null,
        decimal costoActual = 0m,
        decimal costoEstandar = 0m,
        bool afectoImpuesto = true,
        string? proveedorDefecto = null,
        Guid? listaPreciosPredeterminadaId = null,
        int decimalesCantidad = 0)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código del producto es obligatorio.", nameof(codigo));
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del producto es obligatorio.", nameof(nombre));
        ValidarDecimalesCantidad(decimalesCantidad);
        ValidarUnidadMedida(tipo, grupoUnidadMedidaId, unidadMedidaDefectoId);
        return new Producto
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            CategoriaProductoId = categoriaProductoId,
            GrupoUnidadMedidaId = grupoUnidadMedidaId,
            UnidadMedidaDefectoId = unidadMedidaDefectoId,
            DecimalesCantidad = decimalesCantidad,
            EsSerializado = esSerializado,
            Descripcion = descripcion?.Trim(),
            Tipo = tipo,
            PrecioBase = Math.Max(0, precioBase),
            ListaPreciosPredeterminadaId = listaPreciosPredeterminadaId,
            CodigoBarras = string.IsNullOrWhiteSpace(codigoBarras) ? null : codigoBarras.Trim(),
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
        Guid? categoriaProductoId,
        Guid? grupoUnidadMedidaId,
        Guid? unidadMedidaDefectoId,
        bool esSerializado,
        string? descripcion,
        TipoProducto tipo = TipoProducto.Inventario,
        decimal precioBase = 0m,
        string? codigoBarras = null,
        string? notas = null,
        decimal costoActual = 0m,
        decimal costoEstandar = 0m,
        bool afectoImpuesto = true,
        string? proveedorDefecto = null,
        Guid? listaPreciosPredeterminadaId = null,
        int decimalesCantidad = 0)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del producto es obligatorio.", nameof(nombre));
        ValidarDecimalesCantidad(decimalesCantidad);
        ValidarUnidadMedida(tipo, grupoUnidadMedidaId, unidadMedidaDefectoId);
        Nombre = nombre.Trim();
        CategoriaProductoId = categoriaProductoId;
        GrupoUnidadMedidaId = grupoUnidadMedidaId;
        UnidadMedidaDefectoId = unidadMedidaDefectoId;
        DecimalesCantidad = decimalesCantidad;
        EsSerializado = esSerializado;
        Descripcion = descripcion?.Trim();
        Tipo = tipo;
        PrecioBase = Math.Max(0, precioBase);
        ListaPreciosPredeterminadaId = listaPreciosPredeterminadaId;
        CodigoBarras = string.IsNullOrWhiteSpace(codigoBarras) ? null : codigoBarras.Trim();
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

    private static void ValidarDecimalesCantidad(int decimalesCantidad)
    {
        if (decimalesCantidad is < 0 or > 5)
            throw new ArgumentOutOfRangeException(nameof(decimalesCantidad), "Los decimales de cantidad deben estar entre 0 y 5.");
    }

    private static void ValidarUnidadMedida(TipoProducto tipo, Guid? grupoUnidadMedidaId, Guid? unidadMedidaDefectoId)
    {
        if (tipo == TipoProducto.Inventario)
        {
            if (grupoUnidadMedidaId is null || grupoUnidadMedidaId == Guid.Empty)
                throw new ArgumentException("Los productos de tipo Inventario requieren especificar un Grupo de Unidades de Medida.", nameof(grupoUnidadMedidaId));

            if (unidadMedidaDefectoId is null || unidadMedidaDefectoId == Guid.Empty)
                throw new ArgumentException("Los productos de tipo Inventario requieren especificar una Unidad de Medida predeterminada.", nameof(unidadMedidaDefectoId));
        }
    }
}
