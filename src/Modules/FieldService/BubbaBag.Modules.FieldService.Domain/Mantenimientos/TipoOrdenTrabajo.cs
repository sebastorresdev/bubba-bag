using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.FieldService.Domain.Mantenimientos;

/// <summary>
/// Catálogo de Tipos de Orden de Trabajo (Mantenimiento parametrizable).
/// Ejemplos: 'Instalación Oficial DIRECTV', 'Plan Vecino', 'Avería / Servicio Técnico', 'Envío Encomienda', 'Preactivación Administrativa'.
/// </summary>
public class TipoOrdenTrabajo : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public bool RequiereVisitaCampo { get; private set; }
    public string ColorHex { get; private set; } = "#0f6cbd";
    public bool Activo { get; private set; }

    private TipoOrdenTrabajo() { }

    public static TipoOrdenTrabajo Crear(
        string codigo,
        string nombre,
        bool requiereVisitaCampo = true,
        string? descripcion = null,
        string colorHex = "#0f6cbd")
    {
        return new TipoOrdenTrabajo
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            RequiereVisitaCampo = requiereVisitaCampo,
            Descripcion = descripcion?.Trim(),
            ColorHex = colorHex,
            Activo = true
        };
    }

    public void Actualizar(string nombre, bool requiereVisitaCampo, string? descripcion, string colorHex)
    {
        Nombre = nombre.Trim();
        RequiereVisitaCampo = requiereVisitaCampo;
        Descripcion = descripcion?.Trim();
        ColorHex = colorHex;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
