using System.ComponentModel.DataAnnotations;

namespace BubbaBag.Modules.Crm.Domain.Ubigeos;

/// <summary>
/// Catálogo Maestro Oficial de Ubigeos del Perú (INEI).
/// </summary>
public class Ubigeo
{
    /// <summary>
    /// Código oficial de 6 dígitos del distrito (IDDIST), ej: '150122' (Miraflores, Lima).
    /// </summary>
    [Key]
    public string Codigo { get; private set; } = default!;

    /// <summary>
    /// Nombre del Departamento (NOMBDEP), ej: 'LIMA'.
    /// </summary>
    public string Departamento { get; private set; } = default!;

    /// <summary>
    /// Nombre de la Provincia (NOMBPROV), ej: 'LIMA'.
    /// </summary>
    public string Provincia { get; private set; } = default!;

    /// <summary>
    /// Nombre del Distrito (NOMBDIST), ej: 'MIRAFLORES'.
    /// </summary>
    public string Distrito { get; private set; } = default!;

    /// <summary>
    /// Nombre de la Capital Legal (NOM_CAPITAL (LEGAL)).
    /// </summary>
    public string? CapitalLegal { get; private set; }

    /// <summary>
    /// Código de la Región Natural (COD_ REG_NAT).
    /// </summary>
    public string? CodigoRegionNatural { get; private set; }

    /// <summary>
    /// Nombre de la Región Natural (REGION NATURAL), ej: 'COSTA', 'SIERRA', 'SELVA'.
    /// </summary>
    public string? RegionNatural { get; private set; }

    private Ubigeo() { }

    public static Ubigeo Crear(
        string codigo,
        string departamento,
        string provincia,
        string distrito,
        string? capitalLegal = null,
        string? codigoRegionNatural = null,
        string? regionNatural = null)
    {
        return new Ubigeo
        {
            Codigo = codigo.Trim(),
            Departamento = departamento.Trim().ToUpperInvariant(),
            Provincia = provincia.Trim().ToUpperInvariant(),
            Distrito = distrito.Trim().ToUpperInvariant(),
            CapitalLegal = capitalLegal?.Trim(),
            CodigoRegionNatural = codigoRegionNatural?.Trim(),
            RegionNatural = regionNatural?.Trim().ToUpperInvariant()
        };
    }
}
