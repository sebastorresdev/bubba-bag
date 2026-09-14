using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Representa un intento logístico o cita presencial de despacho en campo.
/// Una Orden de Trabajo puede tener una o varias visitas hasta su resolución.
/// </summary>
public class OrdenTrabajoVisita : Entity<Guid>
{
    public Guid OrdenTrabajoId { get; private set; }
    public OrdenTrabajo OrdenTrabajo { get; private set; } = default!;

    public string CodigoVisita { get; private set; } = default!;
    public int NumeroVisita { get; private set; } // 1, 2, 3...

    // Referencias a sistemas externos (Siebel CRM / Oracle Field Service TOA)
    public string? NumeroVisitaSiebel { get; private set; } // '1-142O8E0U'
    public string? NumeroVisitaToa { get; private set; }    // '1730748'

    // Asignación de Cuadrilla y Agenda
    public Guid CuadrillaTecnicoId { get; private set; }
    public DateOnly FechaProgramada { get; private set; }
    public string? BloqueHorario { get; private set; } // 'MAÑANA', 'TARDE', '09:00 - 13:00'
    public DateTime? InicioAgendado { get; private set; }
    public DateTime? FinAgendado { get; private set; }

    public EstadoVisita Estado { get; private set; }

    // Tiempos reales de operación (Tolerantes a desconexión/offline)
    public DateTime? FechaSalidaEnCamino { get; private set; }
    public DateTime? FechaInicioReal { get; private set; }
    public DateTime? FechaFinReal { get; private set; }           // Hora real registrada en el dispositivo móvil
    public DateTime? FechaSincronizacion { get; private set; }   // Hora en que el servidor recibió el paquete

    // Firma Digital del Abonado
    public string? FirmaClienteUrl { get; private set; }
    public string? FirmadoPor { get; private set; }               // 'TITULAR', 'TERCERO', 'RECHAZO_FIRMA'
    public string? NombreFirmante { get; private set; }
    public string? DniFirmante { get; private set; }

    // Evidencias Fotográficas Dinámicas (1 a N)
    private readonly List<OrdenTrabajoVisitaEvidencia> _evidencias = new();
    public IReadOnlyCollection<OrdenTrabajoVisitaEvidencia> Evidencias => _evidencias.AsReadOnly();
    public bool EvidenciasConfirmadas { get; private set; }

    // Auditoría de Cancelación / Rechazo
    public Guid? MotivoCancelacionId { get; private set; }
    public MotivoIncidencia? MotivoCancelacion { get; private set; }
    public string? ObservacionesCancelacion { get; private set; }

    public string? ObservacionesTecnico { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    private OrdenTrabajoVisita() { }

    internal OrdenTrabajoVisita(
        Guid ordenTrabajoId,
        string codigoVisita,
        int numeroVisita,
        Guid cuadrillaTecnicoId,
        DateOnly fechaProgramada,
        string? bloqueHorario,
        DateTime? inicioAgendado = null,
        DateTime? finAgendado = null,
        string? numeroVisitaSiebel = null,
        string? numeroVisitaToa = null)
    {
        Id = Guid.NewGuid();
        OrdenTrabajoId = ordenTrabajoId;
        CodigoVisita = string.IsNullOrWhiteSpace(codigoVisita)
            ? throw new ArgumentException("El código de visita es obligatorio.", nameof(codigoVisita))
            : codigoVisita.Trim().ToUpperInvariant();
        NumeroVisita = numeroVisita;
        CuadrillaTecnicoId = cuadrillaTecnicoId;
        FechaProgramada = fechaProgramada;
        BloqueHorario = bloqueHorario?.Trim().ToUpperInvariant();
        InicioAgendado = inicioAgendado;
        FinAgendado = finAgendado;
        NumeroVisitaSiebel = numeroVisitaSiebel?.Trim();
        NumeroVisitaToa = numeroVisitaToa?.Trim();
        Estado = EstadoVisita.Programada;
        CreatedAt = DateTime.UtcNow;
    }

    public void MarcarEnCamino(DateTime? fechaSalida = null)
    {
        if (Estado != EstadoVisita.Programada)
            throw new InvalidOperationException($"No se puede iniciar desplazamiento desde el estado '{Estado}'.");

        Estado = EstadoVisita.EnCamino;
        FechaSalidaEnCamino = fechaSalida ?? DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IniciarAtencion(DateTime? fechaLlegada = null)
    {
        if (Estado != EstadoVisita.Programada && Estado != EstadoVisita.EnCamino)
            throw new InvalidOperationException($"No se puede iniciar atención técnica desde el estado '{Estado}'.");

        Estado = EstadoVisita.EnCurso;
        FechaInicioReal = fechaLlegada ?? DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public OrdenTrabajoVisitaEvidencia AgregarEvidencia(
        string nombre,
        string url,
        bool esObligatoria = false,
        string? observaciones = null,
        string? coordenadasGps = null)
    {
        var evidencia = new OrdenTrabajoVisitaEvidencia(
            Id,
            nombre,
            url,
            esObligatoria,
            observaciones,
            coordenadasGps);

        _evidencias.Add(evidencia);
        ActualizarEstadoEvidencias();
        UpdatedAt = DateTime.UtcNow;

        return evidencia;
    }

    public void CompletarVisita(
        string? firmaUrl,
        string? firmadoPor,
        string? nombreFirmante,
        string? dniFirmante,
        string? observaciones,
        DateTime? fechaFinReal = null,
        bool sincronizadoInmediato = true)
    {
        if (Estado != EstadoVisita.EnCurso)
            throw new InvalidOperationException($"Solo se puede completar una visita que se encuentre en estado '{EstadoVisita.EnCurso}'.");

        Estado = EstadoVisita.Completada;
        FechaFinReal = fechaFinReal ?? DateTime.UtcNow;
        FechaSincronizacion = sincronizadoInmediato ? DateTime.UtcNow : null;

        FirmaClienteUrl = firmaUrl;
        FirmadoPor = firmadoPor?.Trim().ToUpperInvariant();
        NombreFirmante = nombreFirmante?.Trim();
        DniFirmante = dniFirmante?.Trim();

        ObservacionesTecnico = observaciones?.Trim();
        ActualizarEstadoEvidencias();
        UpdatedAt = DateTime.UtcNow;
    }

    public void ConfirmarSincronizacionEvidencias()
    {
        ActualizarEstadoEvidencias();
        FechaSincronizacion = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CancelarVisita(Guid motivoId, string? observaciones = null)
    {
        if (Estado == EstadoVisita.Completada)
            throw new InvalidOperationException("No se puede cancelar una visita que ya ha sido completada.");

        Estado = EstadoVisita.Cancelada;
        MotivoCancelacionId = motivoId;
        ObservacionesCancelacion = observaciones?.Trim();
        FechaFinReal = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarcarVencida(Guid? motivoVencimientoId = null)
    {
        if (Estado == EstadoVisita.Completada || Estado == EstadoVisita.Cancelada)
            return;

        Estado = EstadoVisita.Vencida;
        MotivoCancelacionId = motivoVencimientoId;
        ObservacionesCancelacion = "Vencimiento automático por cierre de jornada diaria.";
        UpdatedAt = DateTime.UtcNow;
    }

    private void ActualizarEstadoEvidencias()
    {
        // Se considera evidencia validada si no hay evidencias obligatorias pendientes
        bool todasObligatoriasCargadas = _evidencias.Where(e => e.EsObligatoria).All(e => !string.IsNullOrWhiteSpace(e.Url));
        EvidenciasConfirmadas = todasObligatoriasCargadas;
    }
}
