using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Subtarea de una Orden de Trabajo (Incident Type de Dynamics 365).
/// Representa la acción puntual (ej: IB01, PC03) y conserva la foto del precio/tarifa aplicada.
/// </summary>
public class OrdenTrabajoTarea : Entity<Guid>
{
    public Guid OrdenTrabajoId { get; private set; }
    public OrdenTrabajo OrdenTrabajo { get; private set; } = default!;

    public string CodigoTarea { get; private set; } = default!;
    public Guid TipoTareaId { get; private set; }
    public TipoTareaServicio TipoTarea { get; private set; } = default!;

    public string? NumeroWoIbs { get; private set; }   // "10.413.971"
    public int ItemNumero { get; private set; }         // 1, 2, 3...
    public EstadoTarea EstadoTarea { get; private set; }

    // =========================================================================
    // SNAPSHOT DE TARIFA CONGELADA (Inmutable)
    // =========================================================================
    public decimal TarifaBaseCongelada { get; private set; }
    public bool EsElegibleBonoIndicador { get; private set; }
    public string? NombreReglaAplicada { get; private set; }

    // Cierre y liquidación mensual de variables
    public decimal MontoBonoFinal { get; private set; } = 0.00m;
    public decimal MontoPenalizacion { get; private set; } = 0.00m;
    public decimal TotalLiquidadoFinal => TarifaBaseCongelada + MontoBonoFinal - MontoPenalizacion;

    // Detalle operativo
    public string? Descripcion { get; private set; }
    public string? ObservacionesCierre { get; private set; }

    // Auditoría de Rechazo / Cancelación
    public Guid? MotivoRechazoId { get; private set; }
    public MotivoIncidencia? MotivoRechazo { get; private set; }
    public string? ObservacionesRechazo { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private OrdenTrabajoTarea() { }

    internal OrdenTrabajoTarea(
        Guid ordenTrabajoId,
        string codigoTarea,
        Guid tipoTareaId,
        decimal tarifaBase,
        bool esElegibleBono,
        int itemNumero,
        string? nombreRegla = null,
        string? numeroWoIbs = null,
        string? descripcion = null)
    {
        Id = Guid.NewGuid();
        OrdenTrabajoId = ordenTrabajoId;
        CodigoTarea = string.IsNullOrWhiteSpace(codigoTarea)
            ? throw new ArgumentException("El código de tarea es obligatorio.", nameof(codigoTarea))
            : codigoTarea.Trim().ToUpperInvariant();
        TipoTareaId = tipoTareaId;
        TarifaBaseCongelada = tarifaBase;
        EsElegibleBonoIndicador = esElegibleBono;
        NombreReglaAplicada = nombreRegla;
        ItemNumero = itemNumero;
        NumeroWoIbs = numeroWoIbs?.Trim();
        Descripcion = descripcion?.Trim();
        EstadoTarea = EstadoTarea.Abierta;
        CreatedAt = DateTime.UtcNow;
    }

    public void RecalcularTarifa(decimal nuevaTarifa, bool esElegibleBono, string nombreRegla)
    {
        TarifaBaseCongelada = nuevaTarifa;
        EsElegibleBonoIndicador = esElegibleBono;
        NombreReglaAplicada = nombreRegla;
    }

    public void Completar(string? observaciones = null)
    {
        EstadoTarea = EstadoTarea.Completa;
        ObservacionesCierre = observaciones?.Trim();
    }

    public void Rechazar(Guid motivoId, string? observaciones = null)
    {
        EstadoTarea = EstadoTarea.Rechazada;
        MotivoRechazoId = motivoId;
        ObservacionesRechazo = observaciones?.Trim();
    }

    public void Cancelar(Guid? motivoId = null, string? observaciones = null)
    {
        EstadoTarea = EstadoTarea.Cancelada;
        MotivoRechazoId = motivoId;
        ObservacionesRechazo = observaciones?.Trim();
    }

    public void AplicarLiquidacionMensual(decimal bono, decimal penalizacion = 0)
    {
        MontoBonoFinal = bono;
        MontoPenalizacion = penalizacion;
    }
}
