using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Catálogo Maestro de Categorías y Familias de Productos y Servicios.
/// </summary>
public class CategoriaProducto : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public Guid? CategoriaPadreId { get; private set; }
    public virtual CategoriaProducto? CategoriaPadre { get; private set; }
    public virtual ICollection<CategoriaProducto> Subcategorias { get; private set; } = new List<CategoriaProducto>();
    public string? Descripcion { get; private set; }
    public bool Activo { get; private set; }

    public bool EsRaiz => CategoriaPadreId == null;

    private CategoriaProducto() { }

    public static CategoriaProducto Crear(
        string nombre,
        Guid? categoriaPadreId = null,
        string? descripcion = null)
    {
        return new CategoriaProducto
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            CategoriaPadreId = categoriaPadreId,
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        Guid? categoriaPadreId,
        string? descripcion)
    {
        if (categoriaPadreId.HasValue && categoriaPadreId.Value == Id)
            throw new InvalidOperationException("Una categoría no puede ser su propia categoría padre.");

        Nombre = nombre.Trim();
        CategoriaPadreId = categoriaPadreId;
        Descripcion = descripcion?.Trim();
    }

    public void AsignarPadre(Guid? categoriaPadreId)
    {
        if (categoriaPadreId.HasValue && categoriaPadreId.Value == Id)
            throw new InvalidOperationException("Una categoría no puede ser su propia categoría padre.");

        CategoriaPadreId = categoriaPadreId;
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
