using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Línea de producto dentro de una transferencia de inventario.
/// </summary>
public class TransferenciaDetalle : Entity<Guid>
{
    public Guid TransferenciaId { get; private set; }
    public CondicionInventario Condicion { get; private set; } = CondicionInventario.Utilizable;
    public Guid? UnidadMedidaId { get; private set; }
    public string? UnidadMedidaNombre { get; private set; }
    public Guid ProductoId { get; private set; }

    public decimal CantidadEnviada { get; private set; }
    public decimal CantidadRecibida { get; private set; }           // Acumulado de recepciones
    public decimal CantidadResuelta { get; private set; }           // Cerrada por supervisor por pérdida/daño

    /// <summary>
    /// Cantidad pendiente de recepción o regularización de este documento.
    /// </summary>
    public decimal CantidadPendiente => CantidadEnviada - CantidadRecibida - CantidadResuelta;

    public virtual ICollection<TransferenciaDetalleSerie> Series { get; private set; } = new List<TransferenciaDetalleSerie>();

    private TransferenciaDetalle() { }

    public static TransferenciaDetalle Crear(
        Guid transferenciaId,
        Guid productoId,
        decimal cantidadEnviada, CondicionInventario condicion = CondicionInventario.Utilizable, Guid? unidadMedidaId = null, string? unidadMedidaNombre = null)
    {
        if (cantidadEnviada <= 0)
            throw new ArgumentException("La cantidad enviada debe ser mayor a cero.", nameof(cantidadEnviada));

        return new TransferenciaDetalle
        {
            Id = Guid.NewGuid(),
            TransferenciaId = transferenciaId,
            ProductoId = productoId,
            Condicion = condicion,
            UnidadMedidaId = unidadMedidaId, UnidadMedidaNombre = unidadMedidaNombre,
            CantidadEnviada = cantidadEnviada,
            CantidadRecibida = 0,
            CantidadResuelta = 0
        };
    }

    public void RegistrarRecepcion(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad a recibir debe ser mayor a cero.", nameof(cantidad));
        if (cantidad > CantidadPendiente)
            throw new InvalidOperationException($"No se puede recibir más de lo pendiente ({CantidadPendiente}). Cantidad solicitada: {cantidad}");

        CantidadRecibida += cantidad;
    }

    public void AgregarSerie(Guid itemSeriadoId, string numeroSerie)
    {
        if (Series.Any(s => s.ItemSeriadoId == itemSeriadoId)) throw new InvalidOperationException("Serie repetida.");
        Series.Add(TransferenciaDetalleSerie.Crear(Id, itemSeriadoId, numeroSerie));
    }

    public void RegistrarResolucion(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad a resolver debe ser mayor a cero.", nameof(cantidad));
        if (cantidad > CantidadPendiente)
            throw new InvalidOperationException($"No se puede resolver más de lo pendiente ({CantidadPendiente}). Cantidad solicitada: {cantidad}");

        CantidadResuelta += cantidad;
    }
}
