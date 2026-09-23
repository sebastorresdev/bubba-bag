using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Representa el acto de descarga o liquidación final de materiales a nivel de la Orden de Trabajo.
/// Consolida todos los consumos e instalaciones de materiales de todos los Trabajos de la orden
/// contra el Almacén custodio (bodega central o vehículo móvil del técnico) para formalizar la rebaja de stock.
/// </summary>
public class LiquidacionMaterial : Entity<Guid>
{
    public Guid OrdenTrabajoId { get; private set; }
    public OrdenTrabajo OrdenTrabajo { get; private set; } = default!;

    public string NumeroLiquidacion { get; private set; } = default!; // 'LIQ-2026-000001'

    /// <summary>
    /// Almacén o Bodega (Física o Camioneta móvil) de donde se rebaja o devuelve el stock.
    /// </summary>
    public Guid AlmacenId { get; private set; }
    public Almacen Almacen { get; private set; } = default!;

    /// <summary>
    /// Usuario de almacén o supervisor que valida y procesa la descarga formal.
    /// </summary>
    public Guid ResponsableId { get; private set; }

    public DateTime FechaLiquidacion { get; private set; } = DateTime.UtcNow;
    public string Estado { get; private set; } = "Borrador"; // Borrador, Confirmada, Anulada
    public string? Observaciones { get; private set; }

    private readonly List<LiquidacionMaterialItem> _items = new();
    public IReadOnlyCollection<LiquidacionMaterialItem> Items => _items.AsReadOnly();

    private LiquidacionMaterial() { }

    public static LiquidacionMaterial Crear(
        Guid ordenTrabajoId,
        string numeroLiquidacion,
        Guid almacenId,
        Guid responsableId,
        string? observaciones = null)
    {
        if (string.IsNullOrWhiteSpace(numeroLiquidacion))
            throw new ArgumentException("El número de liquidación es obligatorio.", nameof(numeroLiquidacion));

        return new LiquidacionMaterial
        {
            Id = Guid.NewGuid(),
            OrdenTrabajoId = ordenTrabajoId,
            NumeroLiquidacion = numeroLiquidacion.Trim().ToUpperInvariant(),
            AlmacenId = almacenId,
            ResponsableId = responsableId,
            FechaLiquidacion = DateTime.UtcNow,
            Estado = "Borrador",
            Observaciones = observaciones?.Trim()
        };
    }

    /// <summary>
    /// Consolida automáticamente las líneas de liquidación a partir de los Materiales de todos los Trabajos de la Orden de Trabajo.
    /// </summary>
    public void ConsolidarDesdeOrden(OrdenTrabajo orden)
    {
        ArgumentNullException.ThrowIfNull(orden);

        _items.Clear();

        // Obtener todos los materiales consumidos en los trabajos de la orden
        var todosLosMateriales = orden.Trabajos
            .SelectMany(t => t.Materiales)
            .Where(m => m.CantidadUtilizada > 0)
            .ToList();

        // 1. Agrupar materiales no seriados por producto
        var noSeriados = todosLosMateriales
            .Where(m => !m.EsSeriado)
            .GroupBy(m => m.ProductoId);

        foreach (var grupo in noSeriados)
        {
            var totalUtilizado = grupo.Sum(m => m.CantidadUtilizada);
            var item = LiquidacionMaterialItem.Crear(
                liquidacionMaterialId: Id,
                productoId: grupo.Key,
                cantidadConsumida: totalUtilizado,
                cantidadDevuelta: 0m,
                esSeriado: false,
                esRetiro: false
            );
            _items.Add(item);
        }

        // 2. Agregar ítems seriados individualmente (trazabilidad por número de serie)
        var seriados = todosLosMateriales.Where(m => m.EsSeriado);
        foreach (var ser in seriados)
        {
            var item = LiquidacionMaterialItem.Crear(
                liquidacionMaterialId: Id,
                productoId: ser.ProductoId,
                cantidadConsumida: ser.EsRetiro ? 0m : ser.CantidadUtilizada,
                cantidadDevuelta: ser.EsRetiro ? ser.CantidadUtilizada : 0m,
                esSeriado: true,
                itemSeriadoId: ser.ItemSeriadoId,
                numeroSerie: ser.NumeroSerie,
                esRetiro: ser.EsRetiro,
                observaciones: ser.Observaciones
            );
            _items.Add(item);
        }
    }

    public void AgregarItem(
        Guid productoId,
        decimal cantidadConsumida,
        decimal cantidadDevuelta = 0m,
        bool esSeriado = false,
        Guid? itemSeriadoId = null,
        string? numeroSerie = null,
        bool esRetiro = false,
        string? observaciones = null)
    {
        var item = LiquidacionMaterialItem.Crear(
            Id,
            productoId,
            cantidadConsumida,
            cantidadDevuelta,
            esSeriado,
            itemSeriadoId,
            numeroSerie,
            esRetiro,
            observaciones
        );
        _items.Add(item);
    }

    public void Confirmar(string? observaciones = null)
    {
        if (Estado == "Confirmada")
            throw new InvalidOperationException("La liquidación ya ha sido confirmada previamente.");

        Estado = "Confirmada";
        FechaLiquidacion = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(observaciones))
            Observaciones = observaciones.Trim();
    }

    public void Anular(string motivo)
    {
        Estado = "Anulada";
        Observaciones = $"Anulada: {motivo}".Trim();
    }
}
