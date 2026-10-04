using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Detalle de producto efectivamente aceptado durante una recepción física en almacén de destino.
/// </summary>
public class RecepcionTransferenciaDetalle : Entity<Guid>
{
    public Guid RecepcionTransferenciaId { get; private set; }
    public Guid TransferenciaDetalleId { get; private set; }
    public Guid ProductoId { get; private set; }
    public decimal CantidadAceptada { get; private set; }
    public string? SeriesAceptadasJson { get; private set; }

    private RecepcionTransferenciaDetalle() { }

    public static RecepcionTransferenciaDetalle Crear(
        Guid recepcionTransferenciaId,
        Guid transferenciaDetalleId,
        Guid productoId,
        decimal cantidadAceptada,
        string? seriesAceptadasJson = null)
    {
        if (cantidadAceptada <= 0)
            throw new ArgumentException("La cantidad aceptada debe ser mayor a cero.", nameof(cantidadAceptada));

        return new RecepcionTransferenciaDetalle
        {
            Id = Guid.NewGuid(),
            RecepcionTransferenciaId = recepcionTransferenciaId,
            TransferenciaDetalleId = transferenciaDetalleId,
            ProductoId = productoId,
            CantidadAceptada = cantidadAceptada,
            SeriesAceptadasJson = seriesAceptadasJson
        };
    }
}
