using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Resultado del tratamiento de una diferencia o incidencia en una transferencia.
/// </summary>
public enum TipoResolucionDiferencia
{
    RestitucionAOrigen = 1,             // Regresó a origen verificado físicamente
    RecepcionComplementariaDestino = 2, // Se encontró después y se dio ingreso
    PerdidaExtravio = 3,                // Se declara pérdida formal justificada
    DanioAveria = 4                     // Llegó inservible/destruido
}

/// <summary>
/// Regularización autorizada por un supervisor para cerrar saldos pendientes de tránsito no recibidos.
/// </summary>
public class ResolucionDiferenciaTransferencia : Entity<Guid>
{
    public Guid OperacionId { get; private set; }
    public Guid TransferenciaId { get; private set; }
    public Guid TransferenciaDetalleId { get; private set; }
    public decimal CantidadAfectada { get; private set; }
    public TipoResolucionDiferencia Resultado { get; private set; }
    public string Motivo { get; private set; } = default!;
    public string? EvidenciaDocumentaria { get; private set; }
    public Guid SupervisorId { get; private set; }
    public string SupervisorNombre { get; private set; } = default!;
    public DateTime FechaResolucion { get; private set; }

    private ResolucionDiferenciaTransferencia() { }

    public static ResolucionDiferenciaTransferencia Crear(
        Guid transferenciaId,
        Guid transferenciaDetalleId,
        decimal cantidadAfectada,
        TipoResolucionDiferencia resultado,
        string motivo,
        Guid supervisorId,
        string supervisorNombre,
        string? evidenciaDocumentaria = null, Guid operacionId = default)
    {
        if (cantidadAfectada <= 0)
            throw new ArgumentException("La cantidad afectada debe ser mayor a cero.", nameof(cantidadAfectada));
        if (string.IsNullOrWhiteSpace(motivo))
            throw new ArgumentException("El motivo de resolución es obligatorio.", nameof(motivo));

        return new ResolucionDiferenciaTransferencia
        {
            Id = Guid.NewGuid(),
            OperacionId = operacionId == Guid.Empty ? Guid.NewGuid() : operacionId,
            TransferenciaId = transferenciaId,
            TransferenciaDetalleId = transferenciaDetalleId,
            CantidadAfectada = cantidadAfectada,
            Resultado = resultado,
            Motivo = motivo.Trim(),
            SupervisorId = supervisorId,
            SupervisorNombre = supervisorNombre.Trim(),
            EvidenciaDocumentaria = evidenciaDocumentaria?.Trim(),
            FechaResolucion = DateTime.UtcNow
        };
    }
}
