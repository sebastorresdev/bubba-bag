using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

using BubbaBag.Modules.ServicioCampo.Domain.Enums;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Representa una línea de trabajo específica dentro de una Orden de Trabajo.
/// Cada Trabajo referencia un Servicio de catálogo, opcionalmente una ConfiguracionServicio que define
/// tareas y materiales previstos, y registra la ejecución real (TareaTrabajo) y los materiales (MaterialTrabajo).
/// </summary>
public class Trabajo : Entity<Guid>
{
    public Guid OrdenTrabajoId { get; private set; }
    public OrdenTrabajo OrdenTrabajo { get; private set; } = default!;

    public string CodigoTrabajo { get; private set; } = default!;

    /// <summary>
    /// Código externo o número de incidente del cliente (ej. DIRECTV / Siebel).
    /// </summary>
    public string? CodigoExterno { get; private set; }

    /// <summary>
    /// Producto/Servicio de catálogo contratado o solicitado en esta línea de trabajo.
    /// </summary>
    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    /// <summary>
    /// Configuración del servicio utilizada como modelo para precargar tareas y materiales teóricos.
    /// </summary>
    public Guid? ConfiguracionServicioId { get; private set; }
    public ConfiguracionServicio? ConfiguracionServicio { get; private set; }

    public int ItemNumero { get; private set; } = 1;
    public EstadoTrabajo Estado { get; private set; } = EstadoTrabajo.Pendiente;

    /// <summary>
    /// Tarifa congelada al momento de asignar o ejecutar este trabajo.
    /// </summary>
    public decimal TarifaBaseCongelada { get; private set; }

    public DateTime? FechaInicio { get; private set; }
    public DateTime? FechaFin { get; private set; }

    public string? ReferenciaEquipo { get; private set; }
    public string? OrigenPrecio { get; private set; }

    public string? Observaciones { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // Colección de tareas en ejecución real
    private readonly List<TareaTrabajo> _tareas = new();
    public IReadOnlyCollection<TareaTrabajo> Tareas => _tareas.OrderBy(t => t.OrdenSecuencia).ToList().AsReadOnly();

    // Colección de materiales (previstos vs utilizados)
    private readonly List<MaterialTrabajo> _materiales = new();
    public IReadOnlyCollection<MaterialTrabajo> Materiales => _materiales.AsReadOnly();

    private Trabajo() { }

    public static Trabajo Crear(
        Guid ordenTrabajoId,
        string codigoTrabajo,
        Guid productoId,
        int itemNumero = 1,
        Guid? configuracionServicioId = null,
        decimal tarifaBaseCongelada = 0m,
        string? observaciones = null,
        string? codigoExterno = null, string? referenciaEquipo = null, string? origenPrecio = null)
    {
        if (string.IsNullOrWhiteSpace(codigoTrabajo))
            throw new ArgumentException("El código de trabajo es obligatorio.", nameof(codigoTrabajo));

        return new Trabajo
        {
            Id = Guid.NewGuid(),
            OrdenTrabajoId = ordenTrabajoId,
            CodigoTrabajo = codigoTrabajo.Trim().ToUpperInvariant(),
            CodigoExterno = codigoExterno?.Trim(),
            ReferenciaEquipo = referenciaEquipo?.Trim(), OrigenPrecio = origenPrecio,
            ProductoId = productoId,
            ItemNumero = Math.Max(1, itemNumero),
            ConfiguracionServicioId = configuracionServicioId,
            TarifaBaseCongelada = Math.Max(0, tarifaBaseCongelada),
            Estado = EstadoTrabajo.Pendiente,
            Observaciones = observaciones?.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Aplica una ConfiguracionServicio al trabajo, precargando automáticamente las tareas y los materiales teóricos previstos.
    /// </summary>
    public void AplicarPlantilla(ConfiguracionServicio plantilla)
    {
        ArgumentNullException.ThrowIfNull(plantilla);

        if (plantilla.ProductoId != ProductoId || !plantilla.Activo)
            throw new InvalidOperationException("La configuración debe estar activa y pertenecer al servicio del trabajo.");
        if (_tareas.Count > 0 || _materiales.Count > 0 || Estado != EstadoTrabajo.Pendiente)
            throw new InvalidOperationException("El trabajo ya tiene una configuración o ejecución; sus datos no pueden reemplazarse.");
        ConfiguracionServicioId = plantilla.Id;

        // Precargar tareas previstas
        foreach (var pt in plantilla.Tareas)
        {
            var tareaTrabajo = TareaTrabajo.Crear(
                trabajoId: Id,
                nombreTarea: pt.Tarea?.Nombre ?? $"Paso {pt.OrdenSecuencia}",
                ordenSecuencia: pt.OrdenSecuencia,
                tareaId: pt.TareaId,
                configuracionTareaId: pt.Id,
                esObligatoria: pt.EsObligatoria,
                requiereEvidencia: pt.RequiereEvidencia, instrucciones: pt.Instrucciones
            );
            _tareas.Add(tareaTrabajo);
        }

        // Precargar materiales previstos
        foreach (var pm in plantilla.Materiales)
        {
            var materialTrabajo = MaterialTrabajo.CrearPrevisto(
                trabajoId: Id,
                productoId: pm.ProductoId,
                cantidadPrevista: pm.CantidadPrevista,
                esSeriado: pm.Producto?.EsSerializado ?? false,
                observaciones: pm.Observaciones, unidadMedidaId: pm.UnidadMedidaId ?? pm.Producto?.UnidadMedidaDefectoId,
                unidadMedidaNombre: pm.UnidadMedida?.Nombre ?? pm.Producto?.UnidadMedidaDefecto?.Nombre, esObligatorio: pm.EsObligatorio
            );
            _materiales.Add(materialTrabajo);
        }
    }

    public void AgregarTarea(string nombreTarea, int ordenSecuencia = 1, Guid? tareaId = null, bool esObligatoria = true, bool requiereEvidencia = false)
    {
        var tarea = TareaTrabajo.Crear(Id, nombreTarea, ordenSecuencia, tareaId, null, esObligatoria, requiereEvidencia);
        _tareas.Add(tarea);
    }

    public void AgregarMaterialPrevisto(Guid productoId, decimal cantidadPrevista, bool esSeriado = false, string? observaciones = null)
    {
        var material = MaterialTrabajo.CrearPrevisto(Id, productoId, cantidadPrevista, esSeriado, observaciones);
        _materiales.Add(material);
    }

    public void RegistrarConsumoMaterial(
        Guid productoId,
        decimal cantidadUtilizada,
        bool esSeriado = false,
        Guid? itemSeriadoId = null,
        string? numeroSerie = null,
        string? numeroSmartCard = null,
        string? observaciones = null)
    {
        var existente = _materiales.FirstOrDefault(m => m.ProductoId == productoId && m.ItemSeriadoId == itemSeriadoId && !m.EsRetiro);
        if (existente != null)
        {
            existente.RegistrarUsoReal(cantidadUtilizada, itemSeriadoId, numeroSerie, numeroSmartCard);
        }
        else
        {
            var nuevo = MaterialTrabajo.CrearConsumoDirecto(Id, productoId, cantidadUtilizada, esSeriado, itemSeriadoId, numeroSerie, numeroSmartCard, observaciones);
            _materiales.Add(nuevo);
        }
    }

    public void ActualizarDatos(string? referenciaEquipo, string? observaciones, string? codigoExterno)
    {
        if (Estado != EstadoTrabajo.Pendiente) throw new InvalidOperationException("Solo se pueden editar trabajos pendientes.");
        ReferenciaEquipo = referenciaEquipo?.Trim(); Observaciones = observaciones?.Trim(); CodigoExterno = codigoExterno?.Trim();
    }

    public void Iniciar()
    {
        Estado = EstadoTrabajo.EnProgreso;
        FechaInicio ??= DateTime.UtcNow;
    }

    public void Completar(string? observaciones = null)
    {
        if (Estado is EstadoTrabajo.Cancelado or EstadoTrabajo.Rechazado)
            throw new InvalidOperationException("El trabajo está cancelado o rechazado.");
        // Validar tareas obligatorias
        var tareasObligatoriasPendientes = _tareas.Where(t => t.EsObligatoria && t.Estado != Enums.EstadoTarea.Completa).ToList();
        if (tareasObligatoriasPendientes.Any())
        {
            var nombres = string.Join(", ", tareasObligatoriasPendientes.Select(t => t.NombreTarea));
            throw new InvalidOperationException($"No se puede completar el trabajo. Tareas obligatorias pendientes: {nombres}.");
        }

        Estado = EstadoTrabajo.Completado;
        FechaFin = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(observaciones))
            Observaciones = observaciones.Trim();
    }

    public void Rechazar(string motivo)
    {
        Estado = EstadoTrabajo.Rechazado;
        FechaFin = DateTime.UtcNow;
        Observaciones = motivo.Trim();
    }

    public void Cancelar(string? motivo = null)
    {
        foreach (var tarea in _tareas.Where(t => t.Estado is EstadoTarea.Abierta or EstadoTarea.EnProgreso))
            tarea.Cancelar(motivo);
        Estado = EstadoTrabajo.Cancelado;
        FechaFin = DateTime.UtcNow;
        Observaciones = motivo?.Trim();
    }
}
