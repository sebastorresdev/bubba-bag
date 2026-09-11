using BubbaBag.SharedKernel;
using BubbaBag.Modules.FieldService.Domain.Enums;
using BubbaBag.Modules.FieldService.Domain.Mantenimientos;
using BubbaBag.Modules.FieldService.Domain.Tarifarios;

namespace BubbaBag.Modules.FieldService.Domain.WorkOrders;

/// <summary>
/// Subtarea de una Orden de Trabajo (Incident Type de Dynamics 365).
/// Representa la acción puntual (ej: IB01, PC03) y conserva la foto de la tarifa aplicada.
/// </summary>
public class WorkOrderTarea : Entity<Guid>
{
    public Guid WorkOrderId { get; private set; }
    public WorkOrder WorkOrder { get; private set; } = default!;

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
    public Guid? TarifarioReglaId { get; private set; }
    public TarifarioRegla? TarifarioRegla { get; private set; }

    // Cierre y liquidación mensual de variables
    public decimal MontoBonoFinal { get; private set; } = 0.00m;
    public decimal MontoPenalizacion { get; private set; } = 0.00m;
    public decimal TotalLiquidadoFinal => TarifaBaseCongelada + MontoBonoFinal - MontoPenalizacion;

    // Detalle operativo
    public string? Descripcion { get; private set; }
    public string? ObservacionesCierre { get; private set; }
    public string? MotivoNoRealizada { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private WorkOrderTarea() { }

    internal WorkOrderTarea(
        Guid workOrderId,
        Guid tipoTareaId,
        decimal tarifaBase,
        bool esElegibleBono,
        int itemNumero,
        string? nombreRegla = null,
        Guid? tarifarioReglaId = null,
        string? numeroWoIbs = null,
        string? descripcion = null)
    {
        Id = Guid.NewGuid();
        WorkOrderId = workOrderId;
        TipoTareaId = tipoTareaId;
        TarifaBaseCongelada = tarifaBase;
        EsElegibleBonoIndicador = esElegibleBono;
        NombreReglaAplicada = nombreRegla;
        TarifarioReglaId = tarifarioReglaId;
        ItemNumero = itemNumero;
        NumeroWoIbs = numeroWoIbs?.Trim();
        Descripcion = descripcion?.Trim();
        EstadoTarea = EstadoTarea.Pendiente;
        CreatedAt = DateTime.UtcNow;
    }

    public void RecalcularTarifa(decimal nuevaTarifa, bool esElegibleBono, string nombreRegla, Guid? reglaId)
    {
        TarifaBaseCongelada = nuevaTarifa;
        EsElegibleBonoIndicador = esElegibleBono;
        NombreReglaAplicada = nombreRegla;
        TarifarioReglaId = reglaId;
    }

    public void Completar(string? observaciones = null)
    {
        EstadoTarea = EstadoTarea.Completada;
        ObservacionesCierre = observaciones?.Trim();
    }

    public void MarcarNoRealizada(string motivo)
    {
        EstadoTarea = EstadoTarea.NoRealizada;
        MotivoNoRealizada = motivo.Trim();
    }

    public void AplicarLiquidacionMensual(decimal bono, decimal penalizacion = 0)
    {
        MontoBonoFinal = bono;
        MontoPenalizacion = penalizacion;
    }
}
