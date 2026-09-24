using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Catálogo Maestro de Unidades de Medida normalizadas (UND, MTR, KGM, CJ, ROL, etc.)
/// con especificación de control de precisión decimal para inventario y facturación.
/// </summary>
public class UnidadMedida : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string Abreviatura { get; private set; } = default!;
    public bool PermiteDecimales { get; private set; }
    public string? Descripcion { get; private set; }
    public bool Activo { get; private set; }

    private UnidadMedida() { }

    public static UnidadMedida Crear(
        string codigo,
        string nombre,
        string abreviatura,
        bool permiteDecimales = false,
        string? descripcion = null)
    {
        return new UnidadMedida
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Abreviatura = abreviatura.Trim(),
            PermiteDecimales = permiteDecimales,
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        string abreviatura,
        bool permiteDecimales,
        string? descripcion = null)
    {
        Nombre = nombre.Trim();
        Abreviatura = abreviatura.Trim();
        PermiteDecimales = permiteDecimales;
        Descripcion = descripcion?.Trim();
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
