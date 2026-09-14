using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Evidencia fotográfica o documental capturada dinámicamente durante una visita técnica.
/// </summary>
public class OrdenTrabajoVisitaEvidencia : Entity<Guid>
{
    public Guid OrdenTrabajoVisitaId { get; private set; }
    public OrdenTrabajoVisita OrdenTrabajoVisita { get; private set; } = default!;

    public string Nombre { get; private set; } = default!; // 'Foto Fachada', 'Foto Antena', 'Medición de Potencia'
    public string Url { get; private set; } = default!;    // Ruta o URL en almacenamiento
    public bool EsObligatoria { get; private set; }
    public string? Observaciones { get; private set; }
    public string? CoordenadasGps { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private OrdenTrabajoVisitaEvidencia() { }

    internal OrdenTrabajoVisitaEvidencia(
        Guid ordenTrabajoVisitaId,
        string nombre,
        string url,
        bool esObligatoria = false,
        string? observaciones = null,
        string? coordenadasGps = null)
    {
        Id = Guid.NewGuid();
        OrdenTrabajoVisitaId = ordenTrabajoVisitaId;
        Nombre = nombre.Trim();
        Url = url.Trim();
        EsObligatoria = esObligatoria;
        Observaciones = observaciones?.Trim();
        CoordenadasGps = coordenadasGps?.Trim();
        CreatedAt = DateTime.UtcNow;
    }
}
