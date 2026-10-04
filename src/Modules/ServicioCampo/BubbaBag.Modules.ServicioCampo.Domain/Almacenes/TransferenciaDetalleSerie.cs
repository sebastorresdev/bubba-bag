using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Registra las series físicas despachadas en una línea de transferencia.
/// </summary>
public class TransferenciaDetalleSerie : Entity<Guid>
{
    public Guid TransferenciaDetalleId { get; private set; }
    public Guid ItemSeriadoId { get; private set; }
    public string NumeroSerie { get; private set; } = default!;
    public Guid? RecepcionDetalleId { get; private set; }
    public Guid? ResolucionId { get; private set; }
    public bool Recibida { get; private set; }
    public bool TieneIncidencia { get; private set; }
    public string? MotivoIncidencia { get; private set; }

    private TransferenciaDetalleSerie() { }

    public static TransferenciaDetalleSerie Crear(
        Guid transferenciaDetalleId,
        Guid itemSeriadoId,
        string numeroSerie)
    {
        return new TransferenciaDetalleSerie
        {
            Id = Guid.NewGuid(),
            TransferenciaDetalleId = transferenciaDetalleId,
            ItemSeriadoId = itemSeriadoId,
            NumeroSerie = numeroSerie.Trim().ToUpperInvariant(),
            Recibida = false,
            TieneIncidencia = false
        };
    }

    public void MarcarRecibida(Guid? recepcionDetalleId = null)
    {
        if (Recibida || ResolucionId.HasValue) throw new InvalidOperationException("La serie ya fue recibida o resuelta.");
        RecepcionDetalleId = recepcionDetalleId;
        Recibida = true;
        TieneIncidencia = false;
    }

    public void Resolver(Guid resolucionId)
    {
        if (Recibida || ResolucionId.HasValue) throw new InvalidOperationException("La serie ya fue recibida o resuelta.");
        ResolucionId = resolucionId;
    }

    public void RegistrarIncidencia(string motivo)
    {
        TieneIncidencia = true;
        MotivoIncidencia = motivo.Trim();
    }
}
