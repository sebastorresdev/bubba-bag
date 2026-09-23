using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Representa una línea de trabajo específica dentro de una Orden de Trabajo.
/// Cada Trabajo referencia un Servicio de catálogo, opcionalmente una PlantillaTrabajo que define
/// tareas y materiales previstos, y registra la ejecución real (TareaTrabajo) y los materiales (MaterialTrabajo).
/// </summary>
public class Trabajo : Entity<Guid>
{
    public Guid OrdenTrabajoId { get; private set; }
    public OrdenTrabajo OrdenTrabajo { get; private set; } = default!;

    public string CodigoTrabajo { get; private set; } = default!;

    /// <summary>
    /// Servicio de catálogo contratado o solicitado en esta línea de trabajo.
    /// </summary>
    public Guid ServicioId { get; private set; }
    public ProductoServicio Servicio { get; private set; } = default!;

    /// <summary>
    /// Plantilla de trabajo utilizada como modelo para precargar tareas y materiales teóricos.
    /// </summary>
    public Guid? PlantillaTrabajoId { get; private set; }
    public PlantillaTrabajo? PlantillaTrabajo { get; private set; }

    public int ItemNumero { get; private set; } = 1;
    public EstadoTrabajo Estado { get; private set; } = EstadoTrabajo.Pendiente;

    /// <summary>
    /// Tarifa congelada al momento de asignar o ejecutar este trabajo.
    /// </summary>
    public decimal TarifaBaseCongelada { get; private set; }

    public DateTime? FechaInicio { get; private set; }
    public DateTime? FechaFin { get; private set; }

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
        Guid servicioId,
        int itemNumero = 1,
        Guid? plantillaTrabajoId = null,
        decimal tarifaBaseCongelada = 0m,
        string? observaciones = null)
    {
        if (string.IsNullOrWhiteSpace(codigoTrabajo))
            throw new ArgumentException("El código de trabajo es obligatorio.", nameof(codigoTrabajo));

        return new Trabajo
        {
            Id = Guid.NewGuid(),
            OrdenTrabajoId = ordenTrabajoId,
            CodigoTrabajo = codigoTrabajo.Trim().ToUpperInvariant(),
            ServicioId = servicioId,
            ItemNumero = Math.Max(1, itemNumero),
            PlantillaTrabajoId = plantillaTrabajoId,
            TarifaBaseCongelada = Math.Max(0, tarifaBaseCongelada),
            Estado = EstadoTrabajo.Pendiente,
            Observaciones = observaciones?.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Aplica una PlantillaTrabajo al trabajo, precargando automáticamente las tareas y los materiales teóricos previstos.
    /// </summary>
    public void AplicarPlantilla(PlantillaTrabajo plantilla)
    {
        ArgumentNullException.ThrowIfNull(plantilla);

        PlantillaTrabajoId = plantilla.Id;

        // Precargar tareas previstas
        foreach (var pt in plantilla.Tareas)
        {
            var tareaTrabajo = TareaTrabajo.Crear(
                trabajoId: Id,
                nombreTarea: pt.Tarea?.Nombre ?? $"Paso {pt.OrdenSecuencia}",
                ordenSecuencia: pt.OrdenSecuencia,
                tareaId: pt.TareaId,
                plantillaTareaId: pt.Id,
                esObligatoria: pt.EsObligatoria,
                requiereEvidencia: pt.RequiereEvidencia
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
                observaciones: pm.Observaciones
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

    public void Iniciar()
    {
        Estado = EstadoTrabajo.EnProgreso;
        FechaInicio ??= DateTime.UtcNow;
    }

    public void Completar(string? observaciones = null)
    {
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
        Estado = EstadoTrabajo.Cancelado;
        FechaFin = DateTime.UtcNow;
        Observaciones = motivo?.Trim();
    }
}
