using System;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

/// <summary>
/// Representa un material o equipo previsto teóricamente dentro de una configuración del servicio.
/// Define la receta de materiales sugeridos o requeridos para ejecutar un servicio.
/// </summary>
public class ConfiguracionMaterial : Entity<Guid>
{
    public Guid ConfiguracionServicioId { get; private set; }
    public ConfiguracionServicio ConfiguracionServicio { get; private set; } = default!;

    public Guid ProductoId { get; private set; }
    public Producto Producto { get; private set; } = default!;

    /// <summary>
    /// Cantidad prevista o sugerida por defecto para la ejecución del trabajo.
    /// </summary>
    public decimal CantidadPrevista { get; private set; }

    /// <summary>
    /// Indica si el consumo de este material es obligatorio para dar por finalizado el trabajo.
    /// </summary>
    public bool EsObligatorio { get; private set; }

    public string? Observaciones { get; private set; }

    public Guid? UnidadMedidaId { get; private set; }
    public UnidadMedida? UnidadMedida { get; private set; }

    private ConfiguracionMaterial() { }

    public static ConfiguracionMaterial Crear(
        Guid configuracionServicioId,
        Guid productoId,
        decimal cantidadPrevista,
        bool esObligatorio = false,
        string? observaciones = null,
        Guid? unidadMedidaId = null)
    {
        if (cantidadPrevista <= 0)
            throw new ArgumentException("La cantidad prevista debe ser mayor a 0.", nameof(cantidadPrevista));

        return new ConfiguracionMaterial
        {
            Id = Guid.NewGuid(),
            ConfiguracionServicioId = configuracionServicioId,
            ProductoId = productoId,
            CantidadPrevista = cantidadPrevista,
            EsObligatorio = esObligatorio,
            Observaciones = observaciones?.Trim(),
            UnidadMedidaId = unidadMedidaId
        };
    }

    public void Modificar(decimal cantidadPrevista, bool esObligatorio, string? observaciones, Guid? unidadMedidaId = null)
    {
        if (cantidadPrevista <= 0)
            throw new ArgumentException("La cantidad prevista debe ser mayor a 0.", nameof(cantidadPrevista));

        CantidadPrevista = cantidadPrevista;
        EsObligatorio = esObligatorio;
        Observaciones = observaciones?.Trim();
        UnidadMedidaId = unidadMedidaId;
    }
}
