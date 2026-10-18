using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Catálogo maestro de motivos de retiro y devolución de equipos.
/// Clasifica las causas por las que un decodificador o CPE ingresa a la logística inversa.
/// </summary>
public class MotivoRetiroEquipo : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public TipoRetiroEquipo TipoRetiro { get; private set; } = TipoRetiroEquipo.AveriaTecnica;
    public string? Descripcion { get; private set; }
    public bool Activo { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    private MotivoRetiroEquipo() { }

    public static MotivoRetiroEquipo Crear(
        string nombre,
        TipoRetiroEquipo tipoRetiro = TipoRetiroEquipo.AveriaTecnica,
        string? descripcion = null)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del motivo de retiro es obligatorio.", nameof(nombre));

        return new MotivoRetiroEquipo
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            TipoRetiro = tipoRetiro,
            Descripcion = descripcion?.Trim(),
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Actualizar(string nombre, TipoRetiroEquipo tipoRetiro, string? descripcion)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del motivo de retiro es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        TipoRetiro = tipoRetiro;
        Descripcion = descripcion?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
        UpdatedAt = DateTime.UtcNow;
    }
}
