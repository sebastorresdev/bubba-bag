using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Catálogo Maestro de Listas de Precios (Price Levels / Tarifa) para cotización y facturación de servicios y productos.
/// Equivalente a la entidad 'PriceLevel' de Microsoft Dynamics 365.
/// </summary>
public class ListaPrecios : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string Codigo { get; private set; } = default!;
    public string Moneda { get; private set; } = "PEN"; // PEN, USD, COP, etc.
    public string? Descripcion { get; private set; }
    public DateTime? FechaInicio { get; private set; }
    public DateTime? FechaFin { get; private set; }
    public bool Activo { get; private set; }

    public virtual ICollection<ElementoListaPrecios> Elementos { get; private set; } = new List<ElementoListaPrecios>();

    private ListaPrecios() { }

    public static ListaPrecios Crear(
        string nombre,
        string codigo,
        string moneda = "PEN",
        string? descripcion = null,
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null)
    {
        return new ListaPrecios
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Moneda = string.IsNullOrWhiteSpace(moneda) ? "PEN" : moneda.Trim().ToUpperInvariant(),
            Descripcion = descripcion?.Trim(),
            FechaInicio = fechaInicio,
            FechaFin = fechaFin,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string moneda,
        string? descripcion = null,
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null)
    {
        Nombre = nombre.Trim();
        Moneda = string.IsNullOrWhiteSpace(moneda) ? "PEN" : moneda.Trim().ToUpperInvariant();
        Descripcion = descripcion?.Trim();
        FechaInicio = fechaInicio;
        FechaFin = fechaFin;
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
