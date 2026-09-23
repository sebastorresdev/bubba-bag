using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Representa las acciones operativas que la empresa ejecuta en campo (producto intangible).
/// Modela sus datos descriptivos y operativos, checklist fotográfico, materiales teóricos y disponibilidad.
/// Puede vincularse opcionalmente a un ProductoComercial cuando el módulo Comercial esté activo.
/// No contiene campos de existencias físicas ni inventario.
/// </summary>
public class Servicio : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    public decimal PrecioBase { get; private set; } = 0m;

    /// <summary>
    /// Catálogo Operativo Básico de Servicios.
    /// </summary>
    public Guid CatalogoServicioId { get; private set; }
    public CatalogoServicio CatalogoServicio { get; private set; } = default!;

    /// <summary>
    /// Vinculación conceptual a ProductoComercial cuando el módulo Comercial está habilitado.
    /// </summary>
    public Guid? ProductoComercialId { get; private set; }

    public int DuracionEstimadaMinutos { get; private set; } = 60;
    public string? CodigoExterno { get; private set; }
    public bool Activo { get; private set; }

    // Plantilla de Tareas / Checklist secuencial con evidencias fotográficas
    private readonly List<ServicioPaso> _pasos = new();
    public IReadOnlyCollection<ServicioPaso> Pasos => _pasos.OrderBy(p => p.NumeroPaso).ToList().AsReadOnly();

    // Receta teórica de materiales requeridos para la orden
    private readonly List<ServicioMaterial> _materialesTeoricos = new();
    public IReadOnlyCollection<ServicioMaterial> MaterialesTeoricos => _materialesTeoricos.AsReadOnly();

    // Matriz de disponibilidad por sucursales/zonas
    private readonly List<SucursalServicio> _sucursalesHabilitadas = new();
    public IReadOnlyCollection<SucursalServicio> SucursalesHabilitadas => _sucursalesHabilitadas.AsReadOnly();

    // Plantillas de trabajo asociadas a este servicio
    private readonly List<PlantillaTrabajo> _plantillas = new();
    public IReadOnlyCollection<PlantillaTrabajo> Plantillas => _plantillas.AsReadOnly();

    private Servicio() { }

    public static Servicio Crear(
        string codigo,
        string nombre,
        Guid catalogoServicioId,
        int duracionEstimadaMinutos = 60,
        string? descripcion = null,
        string? codigoExterno = null,
        decimal precioBase = 0m,
        Guid? productoComercialId = null)
    {
        return new Servicio
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            CatalogoServicioId = catalogoServicioId,
            DuracionEstimadaMinutos = duracionEstimadaMinutos,
            Descripcion = descripcion?.Trim(),
            CodigoExterno = codigoExterno?.Trim(),
            PrecioBase = Math.Max(0, precioBase),
            ProductoComercialId = productoComercialId,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        Guid catalogoServicioId,
        int duracionEstimadaMinutos,
        string? descripcion,
        string? codigoExterno,
        decimal precioBase = 0m,
        Guid? productoComercialId = null)
    {
        Nombre = nombre.Trim();
        CatalogoServicioId = catalogoServicioId;
        DuracionEstimadaMinutos = duracionEstimadaMinutos;
        Descripcion = descripcion?.Trim();
        CodigoExterno = codigoExterno?.Trim();
        PrecioBase = Math.Max(0, precioBase);
        ProductoComercialId = productoComercialId ?? ProductoComercialId;
    }

    public void ConfigurarPasos(IEnumerable<ServicioPaso> pasos)
    {
        _pasos.Clear();
        _pasos.AddRange(pasos);
    }

    public void ConfigurarMaterialesTeoricos(IEnumerable<ServicioMaterial> materiales)
    {
        _materialesTeoricos.Clear();
        _materialesTeoricos.AddRange(materiales);
    }

    public void ConfigurarSucursales(IEnumerable<SucursalServicio> sucursales)
    {
        _sucursalesHabilitadas.Clear();
        _sucursalesHabilitadas.AddRange(sucursales);
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
