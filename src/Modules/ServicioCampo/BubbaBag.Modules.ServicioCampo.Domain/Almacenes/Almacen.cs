using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Representa una ubicación de custodia y control de inventario (física o móvil en vehículo).
/// </summary>
public class Almacen : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public TipoAlmacen Tipo { get; private set; }
    public string? Direccion { get; private set; }
    public string? Telefono { get; private set; }

    // Vinculación opcional a una sede física de la empresa
    public Guid? SucursalId { get; private set; }

    // Vinculación opcional al recurso propietario de la camioneta (si Tipo == Movil)
    public Guid? RecursoId { get; private set; }
    public Guid? RecursoTecnicoId => RecursoId;

    public bool Activo { get; private set; }

    private Almacen() { }

    /// <summary>
    /// Creación estándar estilo Dynamics 365 (solo requiere Nombre y opcionalmente Descripción).
    /// </summary>
    public static Almacen Crear(
        string nombre,
        string? descripcion = null,
        string? codigo = null)
    {
        return new Almacen
        {
            Id = Guid.NewGuid(),
            Codigo = !string.IsNullOrWhiteSpace(codigo)
                ? codigo.Trim().ToUpperInvariant()
                : $"ALM-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            Nombre = nombre.Trim(),
            Descripcion = descripcion?.Trim(),
            Tipo = TipoAlmacen.Fisico,
            Activo = true
        };
    }

    public static Almacen CrearFisico(
        string codigo,
        string nombre,
        Guid? sucursalId = null,
        string? direccion = null,
        string? telefono = null)
    {
        return new Almacen
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Tipo = TipoAlmacen.Fisico,
            SucursalId = sucursalId,
            Direccion = direccion?.Trim(),
            Telefono = telefono?.Trim(),
            Activo = true
        };
    }

    public static Almacen CrearMovil(
        string codigo,
        string nombre,
        Guid recursoId,
        Guid? sucursalId = null)
    {
        return new Almacen
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Tipo = TipoAlmacen.Movil,
            RecursoId = recursoId,
            SucursalId = sucursalId,
            Activo = true
        };
    }

    public void Actualizar(string nombre, string? descripcion = null)
    {
        Nombre = nombre.Trim();
        Descripcion = descripcion?.Trim();
    }

    public void Actualizar(
        string nombre,
        string? direccion,
        string? telefono,
        Guid? sucursalId,
        string? descripcion = null)
    {
        Nombre = nombre.Trim();
        Direccion = direccion?.Trim();
        Telefono = telefono?.Trim();
        SucursalId = sucursalId;
        Descripcion = descripcion?.Trim();
    }

    public void VincularRecurso(Guid? recursoId)
    {
        RecursoId = recursoId;
    }

    public void VincularRecursoTecnico(Guid? recursoTecnicoId) => VincularRecurso(recursoTecnicoId);

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
