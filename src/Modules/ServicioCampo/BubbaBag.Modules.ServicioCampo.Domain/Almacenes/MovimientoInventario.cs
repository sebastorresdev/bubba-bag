using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Registro inmutable del Kardex que audita cada transacción física de entrada, salida o traslado.
/// Proporciona la trazabilidad completa tanto de insumos a granel como de números de serie.
/// </summary>
public class MovimientoInventario : Entity<Guid>
{
    public TipoMovimientoInventario Tipo { get; private set; }

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    public decimal Cantidad { get; private set; }

    /// <summary>
    /// Identificador del equipo individual si el producto es seriado.
    /// </summary>
    public Guid? ItemSeriadoId { get; private set; }
    public ItemSeriado? ItemSeriado { get; private set; }

    public Guid? AlmacenOrigenId { get; private set; }
    public Almacen? AlmacenOrigen { get; private set; }

    public Guid? AlmacenDestinoId { get; private set; }
    public Almacen? AlmacenDestino { get; private set; }

    /// <summary>
    /// Cliente abonado (si la transacción fue una instalación o retiro en domicilio).
    /// </summary>
    public Guid? ClienteId { get; private set; }

    /// <summary>
    /// Orden de trabajo que originó el consumo o retiro.
    /// </summary>
    public Guid? OrdenTrabajoId { get; private set; }

    public string? NumeroDocumento { get; private set; }
    public Guid? UsuarioResponsableId { get; private set; }
    public string? Observaciones { get; private set; }
    public DateTime FechaMovimiento { get; private set; } = DateTime.UtcNow;

    private MovimientoInventario() { }

    public static MovimientoInventario Registrar(
        TipoMovimientoInventario tipo,
        Guid productoId,
        decimal cantidad,
        Guid? almacenOrigenId = null,
        Guid? almacenDestinoId = null,
        Guid? itemSeriadoId = null,
        Guid? clienteId = null,
        Guid? ordenTrabajoId = null,
        string? numeroDocumento = null,
        Guid? usuarioResponsableId = null,
        string? observaciones = null)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad del movimiento debe ser mayor a 0.", nameof(cantidad));

        return new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Tipo = tipo,
            ProductoId = productoId,
            Cantidad = cantidad,
            AlmacenOrigenId = almacenOrigenId,
            AlmacenDestinoId = almacenDestinoId,
            ItemSeriadoId = itemSeriadoId,
            ClienteId = clienteId,
            OrdenTrabajoId = ordenTrabajoId,
            NumeroDocumento = numeroDocumento?.Trim(),
            UsuarioResponsableId = usuarioResponsableId,
            Observaciones = observaciones?.Trim(),
            FechaMovimiento = DateTime.UtcNow
        };
    }
}
