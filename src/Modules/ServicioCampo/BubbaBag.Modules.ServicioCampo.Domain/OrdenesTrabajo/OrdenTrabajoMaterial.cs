using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Representa un material consumido o un equipo instalado/retirado en la ejecución de la Orden de Trabajo.
/// </summary>
public class OrdenTrabajoMaterial : Entity<Guid>
{
    public Guid OrdenTrabajoId { get; private set; }
    public OrdenTrabajo OrdenTrabajo { get; private set; } = default!;

    public Guid? OrdenTrabajoVisitaId { get; private set; }
    public OrdenTrabajoVisita? OrdenTrabajoVisita { get; private set; }

    public Guid ProductoId { get; private set; }

    /// <summary>
    /// Cantidad utilizada (Metros de cable, unidades de conectores, o 1 si es equipo seriado).
    /// </summary>
    public decimal Cantidad { get; private set; }

    /// <summary>
    /// Identificador del equipo individual en inventario (si el producto es seriado).
    /// </summary>
    public Guid? ItemSeriadoId { get; private set; }

    /// <summary>
    /// Snapshot del número de serie instalado o retirado para búsqueda y auditoría rápida.
    /// </summary>
    public string? NumeroSerie { get; private set; }

    /// <summary>
    /// Snapshot de la tarjeta inteligente / RID de DIRECTV si aplica.
    /// </summary>
    public string? NumeroSmartCard { get; private set; }

    /// <summary>
    /// Indica si el registro corresponde a un equipo averiado/sustituido que fue RETIRADO del cliente.
    /// false: Material/Equipo instalado y entregado al abonado.
    /// true: Equipo desmontado y recuperado por el técnico.
    /// </summary>
    public bool EsRetiro { get; private set; }

    public string? Observaciones { get; private set; }
    public DateTime FechaRegistro { get; private set; } = DateTime.UtcNow;

    private OrdenTrabajoMaterial() { }

    internal static OrdenTrabajoMaterial CrearConsumo(
        Guid ordenTrabajoId,
        Guid productoId,
        decimal cantidad,
        Guid? itemSeriadoId = null,
        string? numeroSerie = null,
        string? numeroSmartCard = null,
        Guid? visitaId = null,
        string? observaciones = null)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad consumida debe ser mayor a 0.", nameof(cantidad));

        return new OrdenTrabajoMaterial
        {
            Id = Guid.NewGuid(),
            OrdenTrabajoId = ordenTrabajoId,
            OrdenTrabajoVisitaId = visitaId,
            ProductoId = productoId,
            Cantidad = cantidad,
            ItemSeriadoId = itemSeriadoId,
            NumeroSerie = numeroSerie?.Trim().ToUpperInvariant(),
            NumeroSmartCard = numeroSmartCard?.Trim().ToUpperInvariant(),
            EsRetiro = false,
            Observaciones = observaciones?.Trim(),
            FechaRegistro = DateTime.UtcNow
        };
    }

    internal static OrdenTrabajoMaterial CrearRetiro(
        Guid ordenTrabajoId,
        Guid productoId,
        string numeroSerie,
        Guid? itemSeriadoId = null,
        string? numeroSmartCard = null,
        Guid? visitaId = null,
        string? motivo = null)
    {
        if (string.IsNullOrWhiteSpace(numeroSerie))
            throw new ArgumentException("El número de serie del equipo retirado es obligatorio.", nameof(numeroSerie));

        return new OrdenTrabajoMaterial
        {
            Id = Guid.NewGuid(),
            OrdenTrabajoId = ordenTrabajoId,
            OrdenTrabajoVisitaId = visitaId,
            ProductoId = productoId,
            Cantidad = 1,
            ItemSeriadoId = itemSeriadoId,
            NumeroSerie = numeroSerie.Trim().ToUpperInvariant(),
            NumeroSmartCard = numeroSmartCard?.Trim().ToUpperInvariant(),
            EsRetiro = true,
            Observaciones = motivo?.Trim(),
            FechaRegistro = DateTime.UtcNow
        };
    }
}
