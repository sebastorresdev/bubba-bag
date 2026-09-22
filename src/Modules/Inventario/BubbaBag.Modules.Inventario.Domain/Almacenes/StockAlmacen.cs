using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.Inventario.Domain.Productos;

namespace BubbaBag.Modules.Inventario.Domain.Almacenes;

/// <summary>
/// Representa el balance de existencias de un producto o material no seriado dentro de un almacén físico o móvil.
/// </summary>
public class StockAlmacen : Entity<Guid>
{
    public Guid AlmacenId { get; private set; }
    public Almacen Almacen { get; private set; } = default!;

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    public decimal CantidadDisponible { get; private set; }
    public decimal CantidadReservada { get; private set; }

    public decimal StockTotal => CantidadDisponible + CantidadReservada;

    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    private StockAlmacen() { }

    public static StockAlmacen Crear(Guid almacenId, Guid productoId, decimal cantidadInicial = 0m)
    {
        return new StockAlmacen
        {
            Id = Guid.NewGuid(),
            AlmacenId = almacenId,
            ProductoId = productoId,
            CantidadDisponible = Math.Max(0, cantidadInicial),
            CantidadReservada = 0m,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void AumentarStock(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad a incrementar debe ser mayor a 0.", nameof(cantidad));

        CantidadDisponible += cantidad;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DisminuirStock(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad a descontar debe ser mayor a 0.", nameof(cantidad));

        if (CantidadDisponible < cantidad)
            throw new InvalidOperationException($"Stock insuficiente. Disponible: {CantidadDisponible}, solicitado: {cantidad}.");

        CantidadDisponible -= cantidad;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ReservarStock(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad a reservar debe ser mayor a 0.", nameof(cantidad));

        if (CantidadDisponible < cantidad)
            throw new InvalidOperationException($"Stock insuficiente para reservar. Disponible: {CantidadDisponible}, solicitado: {cantidad}.");

        CantidadDisponible -= cantidad;
        CantidadReservada += cantidad;
        UpdatedAt = DateTime.UtcNow;
    }

    public void LiberarReserva(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad a liberar debe ser mayor a 0.", nameof(cantidad));

        var cantidadALiberar = Math.Min(cantidad, CantidadReservada);
        CantidadReservada -= cantidadALiberar;
        CantidadDisponible += cantidadALiberar;
        UpdatedAt = DateTime.UtcNow;
    }
}
