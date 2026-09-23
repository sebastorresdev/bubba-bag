using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Representa la ejecución real y concreta de una tarea técnica dentro de un Trabajo.
/// Puede originarse a partir de una PlantillaTarea o ser agregada dinámicamente en campo.
/// </summary>
public class TareaTrabajo : Entity<Guid>
{
    public Guid TrabajoId { get; private set; }
    public Trabajo Trabajo { get; private set; } = default!;

    /// <summary>
    /// Vínculo al catálogo maestro de tareas si la tarea está normalizada.
    /// </summary>
    public Guid? TareaId { get; private set; }
    public Tarea? Tarea { get; private set; }

    /// <summary>
    /// Vínculo a la plantilla de origen si fue precargada desde una PlantillaTrabajo.
    /// </summary>
    public Guid? PlantillaTareaId { get; private set; }

    public string NombreTarea { get; private set; } = default!;
    public int OrdenSecuencia { get; private set; } = 1;
    public bool EsObligatoria { get; private set; } = true;
    public bool RequiereEvidencia { get; private set; }

    public EstadoTarea Estado { get; private set; } = EstadoTarea.Abierta;

    public DateTime? FechaInicio { get; private set; }
    public DateTime? FechaFin { get; private set; }

    /// <summary>
    /// Enlace a la evidencia fotográfica capturada por el técnico para esta tarea puntual.
    /// </summary>
    public string? EvidenciaUrl { get; private set; }

    public string? ObservacionesTecnico { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private TareaTrabajo() { }

    public static TareaTrabajo Crear(
        Guid trabajoId,
        string nombreTarea,
        int ordenSecuencia = 1,
        Guid? tareaId = null,
        Guid? plantillaTareaId = null,
        bool esObligatoria = true,
        bool requiereEvidencia = false)
    {
        if (string.IsNullOrWhiteSpace(nombreTarea))
            throw new ArgumentException("El nombre de la tarea es obligatorio.", nameof(nombreTarea));

        return new TareaTrabajo
        {
            Id = Guid.NewGuid(),
            TrabajoId = trabajoId,
            NombreTarea = nombreTarea.Trim(),
            OrdenSecuencia = Math.Max(1, ordenSecuencia),
            TareaId = tareaId,
            PlantillaTareaId = plantillaTareaId,
            EsObligatoria = esObligatoria,
            RequiereEvidencia = requiereEvidencia,
            Estado = EstadoTarea.Abierta,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Iniciar()
    {
        Estado = EstadoTarea.EnProgreso;
        FechaInicio ??= DateTime.UtcNow;
    }

    public void Completar(string? evidenciaUrl = null, string? observaciones = null)
    {
        if (RequiereEvidencia && string.IsNullOrWhiteSpace(evidenciaUrl) && string.IsNullOrWhiteSpace(EvidenciaUrl))
            throw new InvalidOperationException($"La tarea '{NombreTarea}' exige registrar una evidencia fotográfica antes de completarse.");

        Estado = EstadoTarea.Completa;
        FechaFin = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(evidenciaUrl))
            EvidenciaUrl = evidenciaUrl.Trim();
        ObservacionesTecnico = observaciones?.Trim() ?? ObservacionesTecnico;
    }

    public void Rechazar(string motivo, string? observaciones = null)
    {
        Estado = EstadoTarea.Rechazada;
        FechaFin = DateTime.UtcNow;
        ObservacionesTecnico = $"{motivo}. {observaciones}".Trim();
    }

    public void Cancelar(string? motivo = null)
    {
        Estado = EstadoTarea.Cancelada;
        FechaFin = DateTime.UtcNow;
        ObservacionesTecnico = motivo?.Trim();
    }
}
