using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Consumo teórico / estándar de producto o material para ejecutar este servicio.
/// </summary>
public class ServicioMaterial : Entity<Guid>
{
    public Guid ServicioId { get; private set; }
    public Guid ProductoId { get; private set; }
    public decimal CantidadTeorica { get; private set; }
    public string UnidadMedida { get; private set; } = "Unidades";

    private ServicioMaterial() { }

    public static ServicioMaterial Crear(
        Guid servicioId,
        Guid productoId,
        decimal cantidadTeorica,
        string unidadMedida = "Unidades")
    {
        return new ServicioMaterial
        {
            Id = Guid.NewGuid(),
            ServicioId = servicioId,
            ProductoId = productoId,
            CantidadTeorica = cantidadTeorica,
            UnidadMedida = unidadMedida.Trim()
        };
    }

    public void Actualizar(Guid productoId, decimal cantidadTeorica, string unidadMedida)
    {
        ProductoId = productoId;
        CantidadTeorica = cantidadTeorica;
        UnidadMedida = unidadMedida.Trim();
    }
}
