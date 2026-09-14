using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

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
    public bool ExigeFirmaCliente { get; private set; } = true;
    public bool ExigeEvidenciasFotograficas { get; private set; } = true;
    public string ColorHex { get; private set; } = "#0f6cbd";
    public bool Activo { get; private set; }

    private TipoOrdenTrabajo() { }

    public static TipoOrdenTrabajo Crear(
        string codigo,
        string nombre,
        bool requiereVisitaCampo = true,
        bool exigeFirmaCliente = true,
        bool exigeEvidenciasFotograficas = true,
        string? descripcion = null,
        string colorHex = "#0f6cbd")
    {
        return new TipoOrdenTrabajo
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            RequiereVisitaCampo = requiereVisitaCampo,
            ExigeFirmaCliente = exigeFirmaCliente,
            ExigeEvidenciasFotograficas = exigeEvidenciasFotograficas,
            Descripcion = descripcion?.Trim(),
            ColorHex = colorHex,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        bool requiereVisitaCampo,
        bool exigeFirmaCliente,
        bool exigeEvidenciasFotograficas,
        string? descripcion,
        string colorHex)
    {
        Nombre = nombre.Trim();
        RequiereVisitaCampo = requiereVisitaCampo;
        ExigeFirmaCliente = exigeFirmaCliente;
        ExigeEvidenciasFotograficas = exigeEvidenciasFotograficas;
        Descripcion = descripcion?.Trim();
        ColorHex = colorHex;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
