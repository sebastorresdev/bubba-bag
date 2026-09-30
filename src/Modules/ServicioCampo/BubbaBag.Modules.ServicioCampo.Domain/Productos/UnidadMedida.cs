using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Unidad de Medida específica dentro de un Grupo (Unit en Dynamics 365).
/// Soporta conversiones jerárquicas. Cantidad expresa la equivalencia respecto a
/// UnidadMedidaBaseId y FactorConversionTotal la equivalencia final respecto a la raíz.
/// </summary>
public class UnidadMedida : Entity<Guid>
{
    /// <summary>Grupo o familia al que pertenece esta unidad.</summary>
    public Guid GrupoUnidadMedidaId { get; private set; }
    public GrupoUnidadMedida? GrupoUnidadMedida { get; private set; }

    public string Nombre { get; private set; } = default!;

    /// <summary>
    /// Indica si esta unidad es la mínima indivisible del grupo (unidad base).
    /// Solo puede haber una unidad base por grupo. Su cantidad y factor total siempre son 1.
    /// </summary>
    public bool EsUnidadBase { get; private set; }

    /// <summary>
    /// Unidad de referencia inmediata. Null únicamente para la unidad raíz.
    /// </summary>
    public Guid? UnidadMedidaBaseId { get; private set; }
    public UnidadMedida? UnidadMedidaBase { get; private set; }

    /// <summary>
    /// Cuántas unidades de referencia contiene esta unidad.
    /// </summary>
    public decimal Cantidad { get; private set; } = 1m;

    /// <summary>Equivalencia materializada respecto a la unidad raíz del grupo.</summary>
    public decimal FactorConversionTotal { get; private set; } = 1m;

    public bool EstaActivo { get; private set; } = true;

    private UnidadMedida() { }

    /// <summary>Crea la unidad base de un grupo (Factor=1, sin unidad base superior).</summary>
    internal static UnidadMedida CrearUnidadBase(
        Guid grupoId,
        string nombre)
    {
        ValidarNombre(nombre);
        return new UnidadMedida
        {
            Id = Guid.NewGuid(),
            GrupoUnidadMedidaId = grupoId,
            Nombre = nombre.Trim(),
            EsUnidadBase = true,
            UnidadMedidaBaseId = null,
            Cantidad = 1m,
            FactorConversionTotal = 1m,
            EstaActivo = true
        };
    }

    /// <summary>Crea una unidad derivada dentro de un grupo, con su factor de conversión a la base.</summary>
    public static UnidadMedida CrearDerivada(
        Guid grupoId,
        Guid unidadBaseId,
        string nombre,
        decimal cantidad,
        decimal factorConversionTotal)
    {
        ValidarNombre(nombre);

        if (cantidad <= 0)
            throw new ArgumentOutOfRangeException(nameof(cantidad), "La cantidad debe ser mayor a 0.");
        if (factorConversionTotal <= 0)
            throw new ArgumentOutOfRangeException(nameof(factorConversionTotal), "El factor total debe ser mayor a 0.");

        return new UnidadMedida
        {
            Id = Guid.NewGuid(),
            GrupoUnidadMedidaId = grupoId,
            Nombre = nombre.Trim(),
            EsUnidadBase = false,
            UnidadMedidaBaseId = unidadBaseId,
            Cantidad = cantidad,
            FactorConversionTotal = factorConversionTotal,
            EstaActivo = true
        };
    }

    public void Actualizar(string nombre, Guid unidadReferenciaId, decimal cantidad, decimal factorConversionTotal)
    {
        if (EsUnidadBase)
            throw new InvalidOperationException(
                "La unidad base no puede ser modificada directamente. Actualice el nombre a través del grupo.");

        if (unidadReferenciaId == Id)
            throw new InvalidOperationException("Una unidad no puede referenciarse a sí misma.");
        if (cantidad <= 0)
            throw new ArgumentOutOfRangeException(nameof(cantidad), "La cantidad debe ser mayor a 0.");
        if (factorConversionTotal <= 0)
            throw new ArgumentOutOfRangeException(nameof(factorConversionTotal), "El factor total debe ser mayor a 0.");

        ValidarNombre(nombre);
        Nombre = nombre.Trim();
        UnidadMedidaBaseId = unidadReferenciaId;
        Cantidad = cantidad;
        FactorConversionTotal = factorConversionTotal;
    }

    /// <summary>
    /// Convierte una cantidad en esta unidad a su equivalente en la unidad base del grupo.
    /// Ejemplo: 2 "Rollos 100m" → 200 metros.
    /// </summary>
    public decimal ConvertirAUnidadBase(decimal cantidad) => cantidad * FactorConversionTotal;

    /// <summary>
    /// Convierte una cantidad en unidades base a esta unidad.
    /// Ejemplo: 200 metros → 2 "Rollos 100m".
    /// </summary>
    public decimal ConvertirDesdeUnidadBase(decimal cantidadBase) => cantidadBase / FactorConversionTotal;

    public void Activar() => EstaActivo = true;
    public void Desactivar() => EstaActivo = false;

    public void RecalcularFactorConversionTotal(decimal factorConversionTotal)
    {
        if (factorConversionTotal <= 0)
            throw new ArgumentOutOfRangeException(nameof(factorConversionTotal));
        FactorConversionTotal = EsUnidadBase ? 1m : factorConversionTotal;
    }

    internal void ActualizarDatosUnidadBase(string nombre)
    {
        if (!EsUnidadBase)
            throw new InvalidOperationException("Solo una unidad base puede actualizarse desde el grupo.");

        ValidarNombre(nombre);
        Nombre = nombre.Trim();
        Cantidad = 1m;
        FactorConversionTotal = 1m;
    }

    private static void ValidarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la unidad es obligatorio.", nameof(nombre));
    }
}
