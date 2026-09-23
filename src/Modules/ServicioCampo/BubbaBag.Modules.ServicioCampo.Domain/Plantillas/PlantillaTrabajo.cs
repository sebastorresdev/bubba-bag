using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

namespace BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

/// <summary>
/// Plantilla de Trabajo (Work Template).
/// Define la receta técnica estándar de un servicio operativo: tareas secuenciales previstas y materiales previstos.
/// Puede ser asociada a un Trabajo en una Orden de Trabajo para precargar automáticamente sus tareas y materiales.
/// </summary>
public class PlantillaTrabajo : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    /// <summary>
    /// Servicio de catálogo al cual aplica esta plantilla de trabajo.
    /// </summary>
    public Guid ServicioId { get; private set; }
    public Servicio Servicio { get; private set; } = default!;

    /// <summary>
    /// Duración técnica estimada en minutos para la totalidad de tareas de esta plantilla.
    /// </summary>
    public int DuracionEstimadaMinutos { get; private set; } = 60;

    /// <summary>
    /// Indica si esta plantilla es la predeterminada para el servicio asociado.
    /// </summary>
    public bool EsPredeterminada { get; private set; }

    public bool Activo { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // Colección de tareas previstas (checklist y pasos)
    private readonly List<PlantillaTarea> _tareas = new();
    public IReadOnlyCollection<PlantillaTarea> Tareas => _tareas.OrderBy(t => t.OrdenSecuencia).ToList().AsReadOnly();

    // Colección de materiales y equipos previstos (receta teórica)
    private readonly List<PlantillaMaterial> _materiales = new();
    public IReadOnlyCollection<PlantillaMaterial> Materiales => _materiales.AsReadOnly();

    private PlantillaTrabajo() { }

    public static PlantillaTrabajo Crear(
        string codigo,
        string nombre,
        Guid servicioId,
        int duracionEstimadaMinutos = 60,
        string? descripcion = null,
        bool esPredeterminada = false)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código de la plantilla es obligatorio.", nameof(codigo));

        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la plantilla es obligatorio.", nameof(nombre));

        return new PlantillaTrabajo
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            ServicioId = servicioId,
            DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos),
            Descripcion = descripcion?.Trim(),
            EsPredeterminada = esPredeterminada,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Actualizar(
        string nombre,
        int duracionEstimadaMinutos,
        string? descripcion,
        bool esPredeterminada)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la plantilla es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos);
        Descripcion = descripcion?.Trim();
        EsPredeterminada = esPredeterminada;
    }

    public void AgregarTarea(Guid tareaId, int ordenSecuencia, bool esObligatoria = true, bool requiereEvidencia = false, string? instrucciones = null)
    {
        var tarea = PlantillaTarea.Crear(Id, tareaId, ordenSecuencia, esObligatoria, requiereEvidencia, instrucciones);
        _tareas.Add(tarea);
    }

    public void AgregarMaterial(Guid productoId, decimal cantidadPrevista, bool esObligatorio = false, string? observaciones = null)
    {
        var material = PlantillaMaterial.Crear(Id, productoId, cantidadPrevista, esObligatorio, observaciones);
        _materiales.Add(material);
    }

    public void LimpiarTareas() => _tareas.Clear();
    public void LimpiarMateriales() => _materiales.Clear();

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
