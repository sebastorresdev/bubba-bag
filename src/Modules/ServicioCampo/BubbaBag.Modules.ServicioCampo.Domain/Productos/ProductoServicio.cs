using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Representa la especificación operativa de un servicio de campo (producto intangible).
/// Modela los parámetros técnicos de ejecución (duración estimada, tarifa base, código externo)
/// y se vincula con las Plantillas de Trabajo que definen las tareas y materiales previstos.
/// </summary>
public class ProductoServicio : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public decimal PrecioBase { get; private set; } = 0m;
    public int DuracionEstimadaMinutos { get; private set; } = 60;
    public string? CodigoExterno { get; private set; }

    /// <summary>
    /// Vinculación al catálogo general de Producto cuando aplica.
    /// </summary>
    public Guid? ProductoId { get; private set; }

    public bool Activo { get; private set; }

    // Plantillas de trabajo (receta técnica: tareas y materiales previstos)
    private readonly List<PlantillaTrabajo> _plantillas = new();
    public IReadOnlyCollection<PlantillaTrabajo> Plantillas => _plantillas.AsReadOnly();

    private ProductoServicio() { }

    public static ProductoServicio Crear(
        string codigo,
        string nombre,
        int duracionEstimadaMinutos = 60,
        string? descripcion = null,
        string? codigoExterno = null,
        decimal precioBase = 0m,
        Guid? productoId = null)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código del servicio es obligatorio.", nameof(codigo));

        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del servicio es obligatorio.", nameof(nombre));

        return new ProductoServicio
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos),
            Descripcion = descripcion?.Trim(),
            CodigoExterno = codigoExterno?.Trim(),
            PrecioBase = Math.Max(0, precioBase),
            ProductoId = productoId,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        int duracionEstimadaMinutos,
        string? descripcion,
        string? codigoExterno,
        decimal precioBase = 0m,
        Guid? productoId = null)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del servicio es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos);
        Descripcion = descripcion?.Trim();
        CodigoExterno = codigoExterno?.Trim();
        PrecioBase = Math.Max(0, precioBase);
        ProductoId = productoId ?? ProductoId;
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
