using BubbaBag.SharedKernel;
using BubbaBag.Modules.FieldService.Domain.Clientes;
using BubbaBag.Modules.FieldService.Domain.Mantenimientos;

namespace BubbaBag.Modules.FieldService.Domain.Tarifarios;

/// <summary>
/// Cabecera de Tarifario / Lista de Precios con Vigencia Histórica (Effective Dating).
/// </summary>
public class Tarifario : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;          // "TAR-DIR-2026-V1"
    public string Nombre { get; private set; } = default!;          // "Tarifario Oficial DIRECTV 2026"
    
    public Guid ClienteFacturacionId { get; private set; }
    public Cliente ClienteFacturacion { get; private set; } = default!;

    public string Moneda { get; private set; } = "PEN";             // PEN, USD

    // Vigencia
    public DateOnly FechaVigenciaDesde { get; private set; }
    public DateOnly? FechaVigenciaHasta { get; private set; }       // NULL = Vigente
    public bool Activo { get; private set; }

    // Reglas de Tarifación asociadas
    private readonly List<TarifarioRegla> _reglas = new();
    public IReadOnlyCollection<TarifarioRegla> Reglas => _reglas.AsReadOnly();

    private Tarifario() { }

    public static Tarifario Crear(
        string codigo,
        string nombre,
        Guid clienteFacturacionId,
        DateOnly fechaDesde,
        string moneda = "PEN")
    {
        return new Tarifario
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            ClienteFacturacionId = clienteFacturacionId,
            FechaVigenciaDesde = fechaDesde,
            Moneda = moneda.Trim().ToUpperInvariant(),
            Activo = true
        };
    }

    public void CerrarVigencia(DateOnly fechaFin)
    {
        FechaVigenciaHasta = fechaFin;
    }

    public TarifarioRegla AgregarRegla(
        Guid tipoTareaServicioId,
        string nombreRegla,
        decimal tarifaBase,
        bool aplicaBono,
        int prioridad = 10)
    {
        var regla = new TarifarioRegla(Id, tipoTareaServicioId, nombreRegla, tarifaBase, aplicaBono, prioridad);
        _reglas.Add(regla);
        return regla;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
