using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Inventario.Domain.Almacenes;

/// <summary>
/// Representa una ubicación de custodia y control de inventario (física o móvil en vehículo).
/// </summary>
public class Almacen : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public TipoAlmacen Tipo { get; private set; }
    public string? Direccion { get; private set; }
    public string? Telefono { get; private set; }

    // Vinculación opcional a una sede física de la empresa
    public Guid? SucursalId { get; private set; }

    // Vinculación opcional al técnico propietario de la camioneta (si Tipo == Movil)
    public Guid? RecursoTecnicoId { get; private set; }

    public bool Activo { get; private set; }

    private Almacen() { }

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
        Guid recursoTecnicoId,
        Guid? sucursalId = null)
    {
        return new Almacen
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Tipo = TipoAlmacen.Movil,
            RecursoTecnicoId = recursoTecnicoId,
            SucursalId = sucursalId,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string? direccion,
        string? telefono,
        Guid? sucursalId)
    {
        Nombre = nombre.Trim();
        Direccion = direccion?.Trim();
        Telefono = telefono?.Trim();
        SucursalId = sucursalId;
    }

    public void VincularRecursoTecnico(Guid? recursoTecnicoId)
    {
        RecursoTecnicoId = recursoTecnicoId;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
