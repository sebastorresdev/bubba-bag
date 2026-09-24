using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Catálogo Maestro de Categorías y Familias de Productos y Servicios.
/// </summary>
public class CategoriaProducto : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Familia { get; private set; }
    public string? Descripcion { get; private set; }
    public bool Activo { get; private set; }

    private CategoriaProducto() { }

    public static CategoriaProducto Crear(
        string nombre,
        string? familia = null,
        string? descripcion = null)
    {
        return new CategoriaProducto
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            Familia = string.IsNullOrWhiteSpace(familia) ? null : familia.Trim(),
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string? familia,
        string? descripcion)
    {
        Nombre = nombre.Trim();
        Familia = string.IsNullOrWhiteSpace(familia) ? null : familia.Trim();
        Descripcion = descripcion?.Trim();
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
