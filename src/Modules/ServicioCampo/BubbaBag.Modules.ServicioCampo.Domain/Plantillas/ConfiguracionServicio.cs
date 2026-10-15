using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

/// <summary>
/// Configuración del servicio (Work Template).
/// Define la receta técnica estándar de un servicio operativo: tareas secuenciales previstas y materiales previstos.
/// Puede ser asociada a un Trabajo en una Orden de Trabajo para precargar automáticamente sus tareas y materiales.
/// </summary>
public class ConfiguracionServicio : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    /// <summary>
    /// Producto/Servicio de catálogo al cual aplica esta configuración del servicio.
    /// </summary>
    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    /// <summary>
    /// Duración técnica estimada en minutos para la totalidad de tareas de esta plantilla.
    /// </summary>
    public int DuracionEstimadaMinutos { get; private set; } = 60;

    /// <summary>
    /// Tiempo máximo comprometido de SLA (en horas) para la resolución o atención de este servicio.
    /// </summary>
    public int? SlaHorasResolucion { get; private set; }

    /// <summary>
    /// Indica si esta plantilla es la predeterminada para el servicio asociado.
    /// </summary>
    public bool EsPredeterminada { get; private set; }

    public bool Activo { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // Colección de tareas previstas (checklist y pasos)
    private readonly List<ConfiguracionTarea> _tareas = new();
    public IReadOnlyCollection<ConfiguracionTarea> Tareas => _tareas.AsReadOnly();

    // Colección de materiales y equipos previstos (receta teórica)
    private readonly List<ConfiguracionMaterial> _materiales = new();
    public IReadOnlyCollection<ConfiguracionMaterial> Materiales => _materiales.AsReadOnly();

    private ConfiguracionServicio() { }

    public static ConfiguracionServicio Crear(
        string nombre,
        Guid productoId,
        int duracionEstimadaMinutos = 60,
        string? descripcion = null,
        bool esPredeterminada = false,
        int? slaHorasResolucion = null)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la plantilla es obligatorio.", nameof(nombre));

        return new ConfiguracionServicio
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            ProductoId = productoId,
            DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos),
            SlaHorasResolucion = slaHorasResolucion is > 0 ? slaHorasResolucion.Value : null,
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
        bool esPredeterminada,
        Guid? productoId = null,
        int? slaHorasResolucion = null)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la plantilla es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos);
        SlaHorasResolucion = slaHorasResolucion is > 0 ? slaHorasResolucion.Value : null;
        Descripcion = descripcion?.Trim();
        EsPredeterminada = esPredeterminada;
        if (productoId.HasValue && productoId.Value != Guid.Empty)
            ProductoId = productoId.Value;
    }

    public void AgregarTarea(Guid tareaId, int ordenSecuencia, bool esObligatoria = true, bool requiereEvidencia = false, string? instrucciones = null)
    {
        var tarea = ConfiguracionTarea.Crear(Id, tareaId, ordenSecuencia, esObligatoria, requiereEvidencia, instrucciones);
        _tareas.Add(tarea);
    }

    public void AgregarMaterial(Guid productoId, decimal cantidadPrevista, bool esObligatorio = false, string? observaciones = null, Guid? unidadMedidaId = null)
    {
        var material = ConfiguracionMaterial.Crear(Id, productoId, cantidadPrevista, esObligatorio, observaciones, unidadMedidaId);
        _materiales.Add(material);
    }

    public void LimpiarTareas() => _tareas.Clear();
    public void LimpiarMateriales() => _materiales.Clear();

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
