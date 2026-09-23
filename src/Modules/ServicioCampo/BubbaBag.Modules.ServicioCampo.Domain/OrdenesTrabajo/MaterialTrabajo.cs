using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Representa un material o equipo asignado a un Trabajo específico.
/// Registra de forma comparativa la cantidad prevista teóricamente versus la cantidad utilizada realmente en campo.
/// Soporta tanto insumos no seriados (metros de cable, conectores) como equipos seriados (decodificadores, routers).
/// </summary>
public class MaterialTrabajo : Entity<Guid>
{
    public Guid TrabajoId { get; private set; }
    public Trabajo Trabajo { get; private set; } = default!;

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    /// <summary>
    /// Cantidad prevista teóricamente por la plantilla o presupuestada al agendar.
    /// </summary>
    public decimal CantidadPrevista { get; private set; }

    /// <summary>
    /// Cantidad utilizada o consumida realmente por el técnico en campo.
    /// </summary>
    public decimal CantidadUtilizada { get; private set; }

    public bool EsSeriado { get; private set; }

    /// <summary>
    /// Identificador del ítem físico seriado en inventario (si aplica).
    /// </summary>
    public Guid? ItemSeriadoId { get; private set; }

    /// <summary>
    /// Snapshot inmutable del número de serie instalado o retirado.
    /// </summary>
    public string? NumeroSerie { get; private set; }

    /// <summary>
    /// Snapshot de la tarjeta inteligente / RID / SmartCard de DIRECTV o proveedor.
    /// </summary>
    public string? NumeroSmartCard { get; private set; }

    /// <summary>
    /// Indica si corresponde a un equipo averiado/desmontado que fue RETIRADO del cliente.
    /// false: Instalado / consumido. true: Desmontado / recuperado.
    /// </summary>
    public bool EsRetiro { get; private set; }

    public string? Observaciones { get; private set; }
    public DateTime FechaRegistro { get; private set; } = DateTime.UtcNow;

    private MaterialTrabajo() { }

    public static MaterialTrabajo CrearPrevisto(
        Guid trabajoId,
        Guid productoId,
        decimal cantidadPrevista,
        bool esSeriado = false,
        string? observaciones = null)
    {
        return new MaterialTrabajo
        {
            Id = Guid.NewGuid(),
            TrabajoId = trabajoId,
            ProductoId = productoId,
            CantidadPrevista = Math.Max(0, cantidadPrevista),
            CantidadUtilizada = 0m,
            EsSeriado = esSeriado,
            EsRetiro = false,
            Observaciones = observaciones?.Trim(),
            FechaRegistro = DateTime.UtcNow
        };
    }

    public static MaterialTrabajo CrearConsumoDirecto(
        Guid trabajoId,
        Guid productoId,
        decimal cantidadUtilizada,
        bool esSeriado = false,
        Guid? itemSeriadoId = null,
        string? numeroSerie = null,
        string? numeroSmartCard = null,
        string? observaciones = null)
    {
        if (cantidadUtilizada <= 0)
            throw new ArgumentException("La cantidad utilizada debe ser mayor a 0.", nameof(cantidadUtilizada));

        return new MaterialTrabajo
        {
            Id = Guid.NewGuid(),
            TrabajoId = trabajoId,
            ProductoId = productoId,
            CantidadPrevista = cantidadUtilizada,
            CantidadUtilizada = cantidadUtilizada,
            EsSeriado = esSeriado,
            ItemSeriadoId = itemSeriadoId,
            NumeroSerie = numeroSerie?.Trim().ToUpperInvariant(),
            NumeroSmartCard = numeroSmartCard?.Trim().ToUpperInvariant(),
            EsRetiro = false,
            Observaciones = observaciones?.Trim(),
            FechaRegistro = DateTime.UtcNow
        };
    }

    public static MaterialTrabajo CrearRetiro(
        Guid trabajoId,
        Guid productoId,
        string numeroSerie,
        Guid? itemSeriadoId = null,
        string? numeroSmartCard = null,
        string? motivo = null)
    {
        if (string.IsNullOrWhiteSpace(numeroSerie))
            throw new ArgumentException("El número de serie del equipo retirado es obligatorio.", nameof(numeroSerie));

        return new MaterialTrabajo
        {
            Id = Guid.NewGuid(),
            TrabajoId = trabajoId,
            ProductoId = productoId,
            CantidadPrevista = 1m,
            CantidadUtilizada = 1m,
            EsSeriado = true,
            ItemSeriadoId = itemSeriadoId,
            NumeroSerie = numeroSerie.Trim().ToUpperInvariant(),
            NumeroSmartCard = numeroSmartCard?.Trim().ToUpperInvariant(),
            EsRetiro = true,
            Observaciones = motivo?.Trim(),
            FechaRegistro = DateTime.UtcNow
        };
    }

    public void RegistrarUsoReal(decimal cantidadUtilizada, Guid? itemSeriadoId = null, string? numeroSerie = null, string? numeroSmartCard = null)
    {
        if (cantidadUtilizada < 0)
            throw new ArgumentException("La cantidad utilizada no puede ser negativa.", nameof(cantidadUtilizada));

        CantidadUtilizada = cantidadUtilizada;
        if (itemSeriadoId.HasValue) ItemSeriadoId = itemSeriadoId;
        if (!string.IsNullOrWhiteSpace(numeroSerie)) NumeroSerie = numeroSerie.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(numeroSmartCard)) NumeroSmartCard = numeroSmartCard.Trim().ToUpperInvariant();
    }

    public void ModificarCantidadPrevista(decimal cantidadPrevista)
    {
        CantidadPrevista = Math.Max(0, cantidadPrevista);
    }
}
