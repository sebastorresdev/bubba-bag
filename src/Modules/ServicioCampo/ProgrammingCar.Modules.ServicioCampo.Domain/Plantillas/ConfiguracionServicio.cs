using System;
using System.Collections.Generic;
using System.Linq;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.Plantillas;

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
    /// Valor en puntos asignado a este tipo de servicio/trabajo (para cálculo de productividad y avance del técnico).
    /// Si no se especifica, por defecto es 1.0 punto.
    /// </summary>
    public decimal Puntos { get; private set; } = 1.0m;

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

    // Colección de servicios/productos asociados a esta configuración
    private readonly List<ConfiguracionServicioProducto> _servicios = new();
    public IReadOnlyCollection<ConfiguracionServicioProducto> Servicios => _servicios.AsReadOnly();

    private ConfiguracionServicio() { }

    public static ConfiguracionServicio Crear(
        string nombre,
        IEnumerable<Guid> productoIds,
        int duracionEstimadaMinutos = 60,
        string? descripcion = null,
        bool esPredeterminada = false,
        int? slaHorasResolucion = null,
        decimal puntos = 1.0m)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la plantilla es obligatorio.", nameof(nombre));

        var conf = new ConfiguracionServicio
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos),
            SlaHorasResolucion = slaHorasResolucion is > 0 ? slaHorasResolucion.Value : null,
            Puntos = puntos > 0 ? puntos : 1.0m,
            Descripcion = descripcion?.Trim(),
            EsPredeterminada = esPredeterminada,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
        conf.AsignarServicios(productoIds);
        return conf;
    }

    public static ConfiguracionServicio Crear(
        string nombre,
        Guid productoId,
        int duracionEstimadaMinutos = 60,
        string? descripcion = null,
        bool esPredeterminada = false,
        int? slaHorasResolucion = null,
        decimal puntos = 1.0m) => Crear(nombre, new[] { productoId }, duracionEstimadaMinutos, descripcion, esPredeterminada, slaHorasResolucion, puntos);

    public void AsignarServicios(IEnumerable<Guid> productoIds)
    {
        var ids = productoIds.Distinct().Where(id => id != Guid.Empty).ToList();
        if (ids.Count == 0)
            throw new ArgumentException("Debe asociar al menos un servicio técnico a la configuración.", nameof(productoIds));

        ProductoId = ids[0];
        _servicios.RemoveAll(s => !ids.Contains(s.ProductoId));
        foreach (var pId in ids)
        {
            if (!_servicios.Any(s => s.ProductoId == pId))
            {
                _servicios.Add(ConfiguracionServicioProducto.Crear(Id, pId));
            }
        }
    }

    public void Actualizar(
        string nombre,
        int duracionEstimadaMinutos,
        string? descripcion,
        bool esPredeterminada,
        IEnumerable<Guid>? productoIds = null,
        int? slaHorasResolucion = null,
        decimal? puntos = null)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la plantilla es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos);
        SlaHorasResolucion = slaHorasResolucion is > 0 ? slaHorasResolucion.Value : null;
        if (puntos.HasValue && puntos.Value > 0)
            Puntos = puntos.Value;
        Descripcion = descripcion?.Trim();
        EsPredeterminada = esPredeterminada;

        if (productoIds != null && productoIds.Any())
        {
            AsignarServicios(productoIds);
        }
    }

    public void Actualizar(
        string nombre,
        int duracionEstimadaMinutos,
        string? descripcion,
        bool esPredeterminada,
        Guid? productoId,
        int? slaHorasResolucion = null,
        decimal? puntos = null) => Actualizar(nombre, duracionEstimadaMinutos, descripcion, esPredeterminada, productoId.HasValue ? new[] { productoId.Value } : null, slaHorasResolucion, puntos);

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
