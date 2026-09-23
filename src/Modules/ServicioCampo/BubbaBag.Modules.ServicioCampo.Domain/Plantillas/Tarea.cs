using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

/// <summary>
/// Catálogo maestro de tareas o acciones técnicas atómicas ejecutables en campo
/// (ej: "Fijación y apuntamiento de antena", "Tendido de cable coaxial", "Configuración de Decodificador Smart").
/// </summary>
public class Tarea : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    /// <summary>
    /// Duración técnica estimada en minutos para esta acción puntual.
    /// </summary>
    public int DuracionEstimadaMinutos { get; private set; } = 15;

    /// <summary>
    /// Indica si al ejecutar esta tarea el técnico debe adjuntar obligatoriamente una evidencia fotográfica.
    /// </summary>
    public bool RequiereEvidenciaFotografica { get; private set; }

    public bool Activo { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Tarea() { }

    public static Tarea Crear(
        string codigo,
        string nombre,
        string? descripcion = null,
        int duracionEstimadaMinutos = 15,
        bool requiereEvidenciaFotografica = false)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código de la tarea es obligatorio.", nameof(codigo));

        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la tarea es obligatorio.", nameof(nombre));

        return new Tarea
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Descripcion = descripcion?.Trim(),
            DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos),
            RequiereEvidenciaFotografica = requiereEvidenciaFotografica,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Actualizar(
        string nombre,
        string? descripcion,
        int duracionEstimadaMinutos,
        bool requiereEvidenciaFotografica)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la tarea es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        Descripcion = descripcion?.Trim();
        DuracionEstimadaMinutos = Math.Max(1, duracionEstimadaMinutos);
        RequiereEvidenciaFotografica = requiereEvidenciaFotografica;
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
