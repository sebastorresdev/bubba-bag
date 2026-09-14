using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Catálogo maestro de motivos de cancelación, rechazo e incidencias.
/// Parametrizable por la empresa según el ámbito (Visita, Orden de Trabajo o Subtarea).
/// </summary>
public class MotivoIncidencia : Entity<Guid>
{
    public string Codigo { get; private set; } = default!; // 'VIS-01', 'ORD-02', 'TAR-01'
    public string Nombre { get; private set; } = default!; // 'Cliente ausente en domicilio'
    public string? Descripcion { get; private set; }
    public AmbitoMotivo Ambito { get; private set; }
    public bool Activo { get; private set; }

    private MotivoIncidencia() { }

    public static MotivoIncidencia Crear(
        string codigo,
        string nombre,
        AmbitoMotivo ambito,
        string? descripcion = null)
    {
        return new MotivoIncidencia
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Ambito = ambito,
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(string nombre, AmbitoMotivo ambito, string? descripcion)
    {
        Nombre = nombre.Trim();
        Ambito = ambito;
        Descripcion = descripcion?.Trim();
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
