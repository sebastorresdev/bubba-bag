using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Representa una unidad física individual y trazable por su número de serie, SmartCard o MAC.
/// Gestiona la custodia física y la trazabilidad 360° desde el ingreso hasta su instalación en el cliente.
/// </summary>
public class ItemSeriado : Entity<Guid>
{
    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    public string NumeroSerie { get; private set; } = default!;
    public string? NumeroSmartCard { get; private set; }
    public string? MacAddress { get; private set; }

    /// <summary>
    /// Ubicación actual dentro de una bodega o custodia personal.
    /// Es nulo cuando el equipo se encuentra instalado en el domicilio del cliente.
    /// </summary>
    public Guid? UbicacionActualId { get; private set; }
    public UbicacionInventario? UbicacionActual { get; private set; }
    public Guid? TransferenciaEnTransitoId { get; private set; }
    public CondicionInventario Condicion { get; private set; } = CondicionInventario.Utilizable;

    public EstadoItemSeriado Estado { get; private set; }

    /// <summary>
    /// Cliente abonado donde se encuentra instalado el equipo (si Estado == InstaladoEnCliente).
    /// </summary>
    public Guid? ClienteActualId { get; private set; }

    /// <summary>
    /// Orden de trabajo con la que se realizó la instalación.
    /// </summary>
    public Guid? OrdenTrabajoInstalacionId { get; private set; }
    public DateTime? FechaInstalacion { get; private set; }

    public string? Observaciones { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    private ItemSeriado() { }

    public static ItemSeriado Crear(
        Guid productoId,
        string numeroSerie,
        Guid ubicacionInicialId,
        string? numeroSmartCard = null,
        string? macAddress = null,
        string? observaciones = null)
    {
        if (string.IsNullOrWhiteSpace(numeroSerie))
            throw new ArgumentException("El número de serie es obligatorio.", nameof(numeroSerie));

        return new ItemSeriado
        {
            Id = Guid.NewGuid(),
            ProductoId = productoId,
            NumeroSerie = numeroSerie.Trim().ToUpperInvariant(),
            NumeroSmartCard = numeroSmartCard?.Trim().ToUpperInvariant(),
            MacAddress = macAddress?.Trim().ToUpperInvariant(),
            UbicacionActualId = ubicacionInicialId,
            Estado = EstadoItemSeriado.EnAlmacen,
            Observaciones = observaciones?.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Marca el equipo en tránsito hacia un almacén de destino.
    /// </summary>
    public void DespacharEnTransito(Guid transferenciaId)
    {
        if (!UbicacionActualId.HasValue || TransferenciaEnTransitoId.HasValue)
            throw new InvalidOperationException("La serie no está disponible en una ubicación.");
        UbicacionActualId = null;
        TransferenciaEnTransitoId = transferenciaId;
        Estado = EstadoItemSeriado.EnTransito;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Ubicar(Guid ubicacionId, TipoAlmacen tipo, CondicionInventario? condicion = null)
    {
        if (ubicacionId == Guid.Empty) throw new ArgumentException("La ubicación es obligatoria.");
        UbicacionActualId = ubicacionId;
        TransferenciaEnTransitoId = null;
        if (condicion.HasValue) Condicion = condicion.Value;
        Estado = Condicion == CondicionInventario.Defectuoso
            ? EstadoItemSeriado.AveriadoEnAlmacen
            : tipo == TipoAlmacen.CustodiaPersonal ? EstadoItemSeriado.EnCustodiaTecnico : EstadoItemSeriado.EnAlmacen;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Registra la instalación definitiva del equipo en el cliente al cerrar la orden de trabajo.
    /// El equipo sale de la camioneta del técnico y su custodia pasa al cliente.
    /// </summary>
    public void InstalarEnCliente(Guid clienteId, Guid ordenTrabajoId)
    {
        if (Estado != EstadoItemSeriado.EnCustodiaTecnico && Estado != EstadoItemSeriado.EnAlmacen)
            throw new InvalidOperationException($"No se puede instalar un equipo en estado '{Estado}'. Debe estar en custodia de técnico o en almacén.");

        UbicacionActualId = null; // Ya no está en ningún almacén de la empresa
        ClienteActualId = clienteId;
        OrdenTrabajoInstalacionId = ordenTrabajoId;
        FechaInstalacion = DateTime.UtcNow;
        Estado = EstadoItemSeriado.InstaladoEnCliente;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Registra el retiro de un equipo averiado de la casa del cliente durante una visita técnica.
    /// Pasa a estar en custodia temporal de la camioneta del técnico.
    /// </summary>
    public void RetirarPorAveria(Guid almacenMovilId, Guid clienteId, Guid ordenTrabajoId, string? motivo = null)
    {
        UbicacionActualId = almacenMovilId;
        ClienteActualId = clienteId;
        OrdenTrabajoInstalacionId = ordenTrabajoId;
        Estado = EstadoItemSeriado.RetiradoPorAveria;
        Observaciones = string.IsNullOrWhiteSpace(motivo) ? Observaciones : $"Retirado por avería en OT: {motivo}";
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Registra la devolución formal del equipo dañado o en exceso a la empresa proveedora (DIRECTV).
    /// </summary>
    public void DevolverAProveedor(string? documentoDevolucion = null)
    {
        UbicacionActualId = null;
        Estado = EstadoItemSeriado.DevueltoAProveedor;
        Observaciones = string.IsNullOrWhiteSpace(documentoDevolucion)
            ? Observaciones
            : $"Devuelto a proveedor según doc: {documentoDevolucion}";
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Da de baja el equipo por pérdida, robo o daño irreparable.
    /// </summary>
    public void DarDeBaja(string motivo)
    {
        UbicacionActualId = null;
        TransferenciaEnTransitoId = null;
        Estado = EstadoItemSeriado.BajaPorPerdida;
        Observaciones = $"Baja por: {motivo}";
        UpdatedAt = DateTime.UtcNow;
    }
}
