using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Saldo por producto, ubicación y condición, incluyendo los productos seriados.
/// </summary>
public class StockAlmacen : Entity<Guid>
{
    public Guid UbicacionId { get; private set; }
    public UbicacionInventario Ubicacion { get; private set; } = default!;
    public CondicionInventario Condicion { get; private set; } = CondicionInventario.Utilizable;

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    public decimal CantidadDisponible { get; private set; }
    public decimal CantidadReservada { get; private set; }

    public decimal StockTotal => CantidadDisponible + CantidadReservada;

    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    private StockAlmacen() { }

    public static StockAlmacen Crear(Guid ubicacionId, Guid productoId, decimal cantidadInicial = 0m, CondicionInventario condicion = CondicionInventario.Utilizable)
    {
        if (ubicacionId == Guid.Empty || productoId == Guid.Empty || cantidadInicial < 0 || !Enum.IsDefined(condicion))
            throw new ArgumentException("La ubicación, producto y cantidad inicial no son válidos.");
        return new StockAlmacen
        {
            Id = Guid.NewGuid(),
            UbicacionId = ubicacionId,
            Condicion = condicion,
            ProductoId = productoId,
            CantidadDisponible = cantidadInicial,
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
