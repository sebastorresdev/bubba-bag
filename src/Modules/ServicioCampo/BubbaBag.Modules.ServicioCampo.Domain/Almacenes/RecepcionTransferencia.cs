using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Evento de recepción física de mercadería transferida en el almacén de destino.
/// Permite incorporar cantidades al stock del destino y reducir el saldo en tránsito.
/// </summary>
public class RecepcionTransferencia : Entity<Guid>
{
    public Guid OperacionId { get; private set; }
    public DateTime FechaReal { get; private set; }
    public string NumeroRecepcion { get; private set; } = default!; // 'REC-TRF-20261001-0001'
    public Guid TransferenciaId { get; private set; }
    public virtual Transferencia? Transferencia { get; private set; }

    public DateTime FechaRecepcion { get; private set; }
    public Guid RecibidoPorId { get; private set; }
    public string RecibidoPorNombre { get; private set; } = default!;
    public string? Observaciones { get; private set; }

    public virtual ICollection<RecepcionTransferenciaDetalle> Lineas { get; private set; } = new List<RecepcionTransferenciaDetalle>();

    private RecepcionTransferencia() { }

    public static RecepcionTransferencia Crear(
        string numeroRecepcion,
        Guid transferenciaId,
        Guid recibidoPorId,
        string recibidoPorNombre,
        string? observaciones = null, Guid operacionId = default, DateTime? fechaReal = null)
    {
        return new RecepcionTransferencia
        {
            Id = Guid.NewGuid(),
            OperacionId = operacionId == Guid.Empty ? Guid.NewGuid() : operacionId,
            FechaReal = fechaReal ?? DateTime.UtcNow,
            NumeroRecepcion = numeroRecepcion.Trim().ToUpperInvariant(),
            TransferenciaId = transferenciaId,
            FechaRecepcion = DateTime.UtcNow,
            RecibidoPorId = recibidoPorId,
            RecibidoPorNombre = recibidoPorNombre.Trim(),
            Observaciones = observaciones?.Trim()
        };
    }

    public RecepcionTransferenciaDetalle AgregarLinea(Guid transferenciaDetalleId, Guid productoId, decimal cantidad, string? seriesJson = null)
    {
        var linea = RecepcionTransferenciaDetalle.Crear(Id, transferenciaDetalleId, productoId, cantidad, seriesJson);
        Lineas.Add(linea);
        return linea;
    }
}
