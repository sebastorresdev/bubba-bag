using BubbaBag.SharedKernel;
using BubbaBag.Modules.FieldService.Domain.Mantenimientos;

namespace BubbaBag.Modules.FieldService.Domain.Tarifarios;

/// <summary>
/// Regla o Patrón de cobro dentro de un Tarifario.
/// Define el precio base y si aplica a indicadores o es pago fijo.
/// </summary>
public class TarifarioRegla : Entity<Guid>
{
    public Guid TarifarioId { get; private set; }
    public Tarifario Tarifario { get; private set; } = default!;

    public Guid TipoTareaServicioId { get; private set; }
    public TipoTareaServicio TipoTareaServicio { get; private set; } = default!; // IB01, etc.

    public string NombreRegla { get; private set; } = default!;       // "IB01 Excepción Chimbote Venta Propia"
    public decimal MontoTarifaBase { get; private set; }              // S/. 70.00 o S/. 60.00
    public bool AplicaBonoIndicador { get; private set; }             // FALSE si no recibe bono, TRUE si sí
    public int Prioridad { get; private set; } = 10;                  // 1 = máxima prioridad (excepciones), 99 = general

    // Criterios dinámicos asociados
    private readonly List<TarifarioReglaCriterio> _criterios = new();
    public IReadOnlyCollection<TarifarioReglaCriterio> Criterios => _criterios.AsReadOnly();

    public int PesoEspecificidad => _criterios.Count;

    private TarifarioRegla() { }

    internal TarifarioRegla(
        Guid tarifarioId,
        Guid tipoTareaServicioId,
        string nombreRegla,
        decimal monto,
        bool aplicaBono,
        int prioridad)
    {
        Id = Guid.NewGuid();
        TarifarioId = tarifarioId;
        TipoTareaServicioId = tipoTareaServicioId;
        NombreRegla = nombreRegla.Trim();
        MontoTarifaBase = monto;
        AplicaBonoIndicador = aplicaBono;
        Prioridad = prioridad;
    }

    public void AgregarCriterio(string campoWorkOrder, string valorEsperado, string operador = "IGUAL")
    {
        _criterios.Add(new TarifarioReglaCriterio(Id, campoWorkOrder, valorEsperado, operador));
    }
}
