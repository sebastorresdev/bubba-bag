using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.FieldService.Domain.Mantenimientos;

/// <summary>
/// Catálogo de Fuentes u Orígenes de Ordenes de Trabajo (Parametrizable).
/// Ejemplos: 'DIR_SIEBEL' (DIRECTV Siebel Excel), 'CLARO_SGA' (Claro), 'VENDEDOR_PV' (Plan Vecino), 'MANUAL_INTERNO'.
/// </summary>
public class OrigenOrden : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public bool EsIntegracionExterna { get; private set; }
    public bool Activo { get; private set; }

    private OrigenOrden() { }

    public static OrigenOrden Crear(
        string codigo,
        string nombre,
        bool esIntegracionExterna = false,
        string? descripcion = null)
    {
        return new OrigenOrden
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            EsIntegracionExterna = esIntegracionExterna,
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(string nombre, bool esIntegracionExterna, string? descripcion)
    {
        Nombre = nombre.Trim();
        EsIntegracionExterna = esIntegracionExterna;
        Descripcion = descripcion?.Trim();
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
