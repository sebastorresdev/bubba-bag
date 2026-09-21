using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Ventas.Domain.ListasPrecio;

/// <summary>
/// Representa el conjunto de productos comerciales con su precio según una condición comercial específica
/// (ej. "Tarifa Contrata Lima 2026", "Precio Mayorista", "Tarifa POS Mostrador", "Campaña Corporativa").
/// Debe referenciar únicamente a ProductoComercial (mediante sus ítems).
/// Puede estar asociada opcionalmente a uno o varios CatalogoProductoComercial.
/// No debe referenciar directamente a Servicio ni a ProductoInventario.
/// Es una herramienta comercial usada para ventas, POS y facturación.
/// Vive conceptualmente en el módulo Comercial (Centro de Ventas & POS).
/// </summary>
public class ListaPrecio : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public string Moneda { get; private set; } = "PEN"; // PEN, USD
    public DateTime? VigenciaDesde { get; private set; }
    public DateTime? VigenciaHasta { get; private set; }
    public bool EsPredeterminada { get; private set; }

    /// <summary>
    /// Vinculación comercial opcional a un Cliente o Segmento específico (ej. DIRECTV, Grandes Cuentas).
    /// </summary>
    public Guid? EntidadComercialId { get; private set; }

    public Guid? ClienteId => EntidadComercialId;

    public bool Activo { get; private set; }

    // Asociación opcional a uno o varios Catálogos Comerciales (CatalogoProductoComercial)
    private readonly List<Guid> _catalogosAsociadosIds = new();
    public IReadOnlyCollection<Guid> CatalogosAsociadosIds => _catalogosAsociadosIds.AsReadOnly();

    // Ítems de precios fijados exclusivamente sobre ProductoComercial
    private readonly List<ListaPrecioItem> _items = new();
    public IReadOnlyCollection<ListaPrecioItem> Items => _items.AsReadOnly();

    private ListaPrecio() { }

    public static ListaPrecio Crear(
        string codigo,
        string nombre,
        string moneda = "PEN",
        string? descripcion = null,
        DateTime? vigenciaDesde = null,
        DateTime? vigenciaHasta = null,
        bool esPredeterminada = false,
        Guid? entidadComercialId = null)
    {
        return new ListaPrecio
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Moneda = moneda.Trim().ToUpperInvariant(),
            Descripcion = descripcion?.Trim(),
            VigenciaDesde = vigenciaDesde,
            VigenciaHasta = vigenciaHasta,
            EsPredeterminada = esPredeterminada,
            EntidadComercialId = entidadComercialId,
            Activo = true
        };
    }

    public static ListaPrecio Crear(
        string nombre,
        string moneda = "PEN",
        string? descripcion = null,
        DateTime? vigenciaDesde = null,
        DateTime? vigenciaHasta = null,
        bool esPredeterminada = false,
        Guid? clienteId = null)
    {
        return Crear(
            nombre.Length >= 3 ? nombre[..3].ToUpperInvariant() : "LP",
            nombre,
            moneda,
            descripcion,
            vigenciaDesde,
            vigenciaHasta,
            esPredeterminada,
            clienteId);
    }

    public void Actualizar(
        string nombre,
        string moneda,
        string? descripcion,
        DateTime? vigenciaDesde,
        DateTime? vigenciaHasta,
        bool esPredeterminada,
        Guid? entidadComercialId)
    {
        Nombre = nombre.Trim();
        Moneda = moneda.Trim().ToUpperInvariant();
        Descripcion = descripcion?.Trim();
        VigenciaDesde = vigenciaDesde;
        VigenciaHasta = vigenciaHasta;
        EsPredeterminada = esPredeterminada;
        EntidadComercialId = entidadComercialId;
    }

    public void AsociarCatalogo(Guid catalogoProductoComercialId)
    {
        if (!_catalogosAsociadosIds.Contains(catalogoProductoComercialId))
        {
            _catalogosAsociadosIds.Add(catalogoProductoComercialId);
        }
    }

    public void DesasociarCatalogo(Guid catalogoProductoComercialId)
    {
        _catalogosAsociadosIds.Remove(catalogoProductoComercialId);
    }

    public void AgregarOActualizarPrecio(Guid productoComercialId, decimal precioUnitario)
    {
        var itemExistente = _items.Find(i => i.ProductoComercialId == productoComercialId);
        if (itemExistente != null)
        {
            itemExistente.ActualizarPrecio(precioUnitario);
        }
        else
        {
            _items.Add(ListaPrecioItem.Crear(Id, productoComercialId, precioUnitario));
        }
    }

    public void RemoverPrecio(Guid productoComercialId)
    {
        _items.RemoveAll(i => i.ProductoComercialId == productoComercialId);
    }

    public void AgregarOActualizarItem(Guid productoId, decimal precioUnitario) => AgregarOActualizarPrecio(productoId, precioUnitario);

    public void LimpiarPrecios()
    {
        _items.Clear();
    }

    public void LimpiarItems() => LimpiarPrecios();

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
    public void MarcarComoPredeterminada(bool predeterminada) => EsPredeterminada = predeterminada;
}
