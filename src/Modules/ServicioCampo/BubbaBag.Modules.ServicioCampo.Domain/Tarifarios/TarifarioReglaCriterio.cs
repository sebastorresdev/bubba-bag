using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;

/// <summary>
/// Criterio dinámico de coincidencia de una Regla (Selector de cualquier campo de la Orden de Trabajo).
/// Ejemplos: Campo: "CIUDAD", Valor: "CHIMBOTE" | Campo: "ORIGEN", Valor: "VENTA_PROPIA" | Campo: "NODO", Valor: "I280010".
/// </summary>
public class TarifarioReglaCriterio : Entity<Guid>
{
    public Guid TarifarioReglaId { get; private set; }
    public TarifarioRegla TarifarioRegla { get; private set; } = default!;

    public string CampoOrdenTrabajo { get; private set; } = default!;    // "CIUDAD", "NODO", "ORIGEN", "SEGMENTO"
    public string OperadorComparacion { get; private set; } = "IGUAL";   // "IGUAL", "CONTIENE", "DIFERENTE"
    public string ValorEsperado { get; private set; } = default!;        // "CHIMBOTE", "I280010"

    private TarifarioReglaCriterio() { }

    internal TarifarioReglaCriterio(
        Guid tarifarioReglaId,
        string campoOrdenTrabajo,
        string valorEsperado,
        string operadorComparacion = "IGUAL")
    {
        Id = Guid.NewGuid();
        TarifarioReglaId = tarifarioReglaId;
        CampoOrdenTrabajo = campoOrdenTrabajo.Trim().ToUpperInvariant();
        ValorEsperado = valorEsperado.Trim().ToUpperInvariant();
        OperadorComparacion = operadorComparacion.Trim().ToUpperInvariant();
    }
}
