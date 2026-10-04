using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Unidad de control de inventario: bodega o custodia personal.
/// </summary>
public class Almacen : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public TipoAlmacen Tipo { get; private set; } = TipoAlmacen.Bodega;

    /// <summary>
    /// Unidad Organizativa (Sede / Base) a la que pertenece este almacén.
    /// Define la pertenencia y las fronteras de abastecimiento y despacho.
    /// </summary>
    public Guid? UnidadOrganizativaId { get; private set; }

    /// <summary>
    /// Si el almacén es de custodia personal, referencia al recurso responsable.
    /// </summary>
    public Guid? RecursoId { get; private set; }

    public bool Activo { get; private set; }

    public Guid? CreadoPorId { get; private set; }
    public string? CreadoPorNombre { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? ActualizadoPorId { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private Almacen() { }

    public static Almacen Crear(
        string nombre,
        string? descripcion,
        Guid? creadoPorId,
        string? creadoPorNombre,
        string? codigo = null,
        TipoAlmacen tipo = TipoAlmacen.Bodega,
        Guid? unidadOrganizativaId = null,
        Guid? recursoId = null)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del almacén es obligatorio.", nameof(nombre));

        var cod = string.IsNullOrWhiteSpace(codigo)
            ? $"ALM-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}"
            : codigo.Trim().ToUpperInvariant();

        return new Almacen
        {
            Id = Guid.NewGuid(),
            Codigo = cod,
            Nombre = nombre.Trim(),
            Descripcion = NormalizarDescripcion(descripcion),
            Tipo = tipo,
            UnidadOrganizativaId = unidadOrganizativaId,
            RecursoId = tipo == TipoAlmacen.CustodiaPersonal ? recursoId : null,
            Activo = true,
            CreadoPorId = creadoPorId,
            CreadoPorNombre = NormalizarDescripcion(creadoPorNombre),
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Almacen CrearBodega(
        string codigo,
        string nombre,
        Guid unidadOrganizativaId,
        string? descripcion = null,
        Guid? creadoPorId = null,
        string? creadoPorNombre = null)
    {
        return Crear(nombre, descripcion, creadoPorId, creadoPorNombre, codigo, TipoAlmacen.Bodega, unidadOrganizativaId, null);
    }

    public static Almacen CrearCustodiaPersonal(
        string codigo,
        string nombre,
        Guid unidadOrganizativaId,
        Guid recursoId,
        string? descripcion = null,
        Guid? creadoPorId = null,
        string? creadoPorNombre = null)
    {
        return Crear(nombre, descripcion, creadoPorId, creadoPorNombre, codigo, TipoAlmacen.CustodiaPersonal, unidadOrganizativaId, recursoId);
    }

    public void Actualizar(
        string nombre,
        string? descripcion,
        Guid? actualizadoPorId,
        string? codigo = null,
        TipoAlmacen? tipo = null,
        Guid? unidadOrganizativaId = null,
        Guid? recursoId = null)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del almacén es obligatorio.", nameof(nombre));

        if (tipo.HasValue && tipo.Value != Tipo || unidadOrganizativaId.HasValue && unidadOrganizativaId != UnidadOrganizativaId || recursoId.HasValue && recursoId != RecursoId)
            throw new InvalidOperationException("El tipo, unidad y custodio se conservan. Para cambiar custodia personal, transfiera el material a otro almacén.");
        Nombre = nombre.Trim();
        Descripcion = NormalizarDescripcion(descripcion);
        if (!string.IsNullOrWhiteSpace(codigo))
            Codigo = codigo.Trim().ToUpperInvariant();
        if (tipo.HasValue)
            Tipo = tipo.Value;
        if (unidadOrganizativaId.HasValue)
            UnidadOrganizativaId = unidadOrganizativaId.Value;
        if (recursoId.HasValue)
            RecursoId = recursoId.Value;

        RegistrarActualizacion(actualizadoPorId);
    }

    public void AsignarUnidadOrganizativa(Guid unidadOrganizativaId)
    {
        UnidadOrganizativaId = unidadOrganizativaId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AsignarCustodio(Guid? recursoId)
    {
        RecursoId = recursoId;
        UpdatedAt = DateTime.UtcNow;
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
