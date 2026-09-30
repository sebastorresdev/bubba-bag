using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Grupo o Familia de Unidades de Medida (Unit Group en Dynamics 365).
/// Agrupa unidades relacionadas bajo una unidad base común.
/// Ejemplos: "Longitud" (base: Metro), "Cables" (base: Metro), "Conectores" (base: Unidad).
/// </summary>
public class GrupoUnidadMedida : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Observacion { get; private set; }

    public bool EstaActivo { get; private set; } = true;
    public DateTime FechaCreacion { get; private set; } = DateTime.UtcNow;
    public DateTime? FechaModificacion { get; private set; }

    private readonly List<UnidadMedida> _unidades = new();
    public IReadOnlyCollection<UnidadMedida> Unidades => _unidades.AsReadOnly();

    private GrupoUnidadMedida() { }

    /// <summary>
    /// Crea un grupo de unidades de medida junto con su unidad base obligatoria.
    /// La unidad base se crea automáticamente dentro del grupo.
    /// </summary>
    public static (GrupoUnidadMedida Grupo, UnidadMedida UnidadBase) Crear(
        string nombre,
        string nombreUnidadBase)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del grupo es obligatorio.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nombreUnidadBase))
            throw new ArgumentException("El nombre de la unidad base es obligatorio.", nameof(nombreUnidadBase));

        var grupo = new GrupoUnidadMedida
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            EstaActivo = true,
            FechaCreacion = DateTime.UtcNow
        };

        // La unidad base se crea siempre en la misma transacción
        var unidadBase = UnidadMedida.CrearUnidadBase(grupo.Id, nombreUnidadBase);
        grupo._unidades.Add(unidadBase);

        return (grupo, unidadBase);
    }

    public void Actualizar(string nombre, string? observacion)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del grupo es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        Observacion = string.IsNullOrWhiteSpace(observacion) ? null : observacion.Trim();
        FechaModificacion = DateTime.UtcNow;
    }

    public void Activar()
    {
        EstaActivo = true;
        FechaModificacion = DateTime.UtcNow;
    }

    public void Desactivar()
    {
        EstaActivo = false;
        FechaModificacion = DateTime.UtcNow;
    }
}
