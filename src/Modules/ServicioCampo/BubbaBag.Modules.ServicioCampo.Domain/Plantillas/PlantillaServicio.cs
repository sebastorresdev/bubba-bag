using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

/// <summary>
/// Representa un servicio de catálogo al cual aplica una plantilla de trabajo.
/// Permite vincular una plantilla a múltiples servicios técnicos.
/// </summary>
public class PlantillaServicio : Entity<Guid>
{
    public Guid PlantillaTrabajoId { get; private set; }
    public PlantillaTrabajo PlantillaTrabajo { get; private set; } = default!;

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    /// <summary>
    /// Indica si esta plantilla es la predeterminada para este servicio específico.
    /// </summary>
    public bool EsPredeterminada { get; private set; }

    private PlantillaServicio() { }

    public static PlantillaServicio Crear(
        Guid plantillaTrabajoId,
        Guid productoId,
        bool esPredeterminada = false)
    {
        if (plantillaTrabajoId == Guid.Empty)
            throw new ArgumentException("El ID de la plantilla de trabajo es obligatorio.", nameof(plantillaTrabajoId));

        if (productoId == Guid.Empty)
            throw new ArgumentException("El ID del servicio/producto es obligatorio.", nameof(productoId));

        return new PlantillaServicio
        {
            Id = Guid.NewGuid(),
            PlantillaTrabajoId = plantillaTrabajoId,
            ProductoId = productoId,
            EsPredeterminada = esPredeterminada
        };
    }

    public void EstablecerPredeterminada(bool esPredeterminada)
    {
        EsPredeterminada = esPredeterminada;
    }
}
