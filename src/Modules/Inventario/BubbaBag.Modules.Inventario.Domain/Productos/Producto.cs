using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Inventario.Domain.Productos;

/// <summary>
/// Catálogo Maestro de Productos, Equipos y Materiales de la empresa.
/// </summary>
public class Producto : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public string Categoria { get; private set; } = "Materiales"; // Materiales, Equipos, Insumos, Herramientas
    public string UnidadMedida { get; private set; } = "Unidades"; // Unidades, Metros, Rollos, Cajas
    public bool EsSerializado { get; private set; } // true para decos/routers con serie
    public bool Activo { get; private set; }

    private Producto() { }

    public static Producto Crear(
        string codigo,
        string nombre,
        string categoria = "Materiales",
        string unidadMedida = "Unidades",
        bool esSerializado = false,
        string? descripcion = null)
    {
        return new Producto
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Categoria = categoria.Trim(),
            UnidadMedida = unidadMedida.Trim(),
            EsSerializado = esSerializado,
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string categoria,
        string unidadMedida,
        bool esSerializado,
        string? descripcion)
    {
        Nombre = nombre.Trim();
        Categoria = categoria.Trim();
        UnidadMedida = unidadMedida.Trim();
        EsSerializado = esSerializado;
        Descripcion = descripcion?.Trim();
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
