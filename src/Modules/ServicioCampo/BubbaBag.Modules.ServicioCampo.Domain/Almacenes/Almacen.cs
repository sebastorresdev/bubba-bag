using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Ubicación lógica para custodiar productos, como una bodega o un vehículo.
/// </summary>
public class Almacen : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public bool Activo { get; private set; }

    public Guid? CreadoPorId { get; private set; }
    public string? CreadoPorNombre { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? ActualizadoPorId { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private Almacen() { }

    public static Almacen Crear(string nombre, string? descripcion, Guid? creadoPorId, string? creadoPorNombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del almacén es obligatorio.", nameof(nombre));

        return new Almacen
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            Descripcion = NormalizarDescripcion(descripcion),
            Activo = true,
            CreadoPorId = creadoPorId,
            CreadoPorNombre = NormalizarDescripcion(creadoPorNombre),
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Actualizar(string nombre, string? descripcion, Guid? actualizadoPorId)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del almacén es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        Descripcion = NormalizarDescripcion(descripcion);
        RegistrarActualizacion(actualizadoPorId);
    }

    public void CambiarEstado(bool activo, Guid? actualizadoPorId)
    {
        Activo = activo;
        RegistrarActualizacion(actualizadoPorId);
    }

    private void RegistrarActualizacion(Guid? usuarioId)
    {
        ActualizadoPorId = usuarioId;
        UpdatedAt = DateTime.UtcNow;
    }

    private static string? NormalizarDescripcion(string? descripcion) =>
        string.IsNullOrWhiteSpace(descripcion) ? null : descripcion.Trim();
}
