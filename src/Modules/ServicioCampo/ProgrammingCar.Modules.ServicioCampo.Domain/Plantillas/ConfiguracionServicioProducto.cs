using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.Plantillas;

/// <summary>
/// Relación muchos a uno que asocia múltiples servicios/productos de catálogo
/// a una misma receta técnica / configuración de servicio.
/// </summary>
public class ConfiguracionServicioProducto : Entity<Guid>
{
    public Guid ConfiguracionServicioId { get; private set; }
    public ConfiguracionServicio ConfiguracionServicio { get; private set; } = default!;

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private ConfiguracionServicioProducto() { }

    public static ConfiguracionServicioProducto Crear(Guid configuracionServicioId, Guid productoId)
    {
        if (productoId == Guid.Empty)
            throw new ArgumentException("El producto/servicio no puede ser vacío.", nameof(productoId));

        return new ConfiguracionServicioProducto
        {
            Id = Guid.NewGuid(),
            ConfiguracionServicioId = configuracionServicioId,
            ProductoId = productoId,
            CreatedAt = DateTime.UtcNow
        };
    }
}
