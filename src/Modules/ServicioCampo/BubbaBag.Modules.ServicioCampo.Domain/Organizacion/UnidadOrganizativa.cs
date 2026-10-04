using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Organizacion;

/// <summary>
/// Representa una Unidad Organizativa (Sede / Base territorial de operaciones) como Trujillo, Chiclayo, Piura, Lima, etc.
/// Es la frontera administrativa y logística de la empresa.
/// </summary>
public class UnidadOrganizativa : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;          // Ej: 'TRU', 'CHX', 'PIU', 'LIM', 'ANC'
    public string Nombre { get; private set; } = default!;          // Ej: 'Unidad Organizativa Trujillo'
    public string? Ciudad { get; private set; }
    public string? Direccion { get; private set; }
    public string? Telefono { get; private set; }
    public bool EsSedePrincipal { get; private set; }
    public bool Activo { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private UnidadOrganizativa() { }

    public static UnidadOrganizativa Crear(
        string codigo,
        string nombre,
        string? ciudad = null,
        string? direccion = null,
        string? telefono = null,
        bool esSedePrincipal = false,
        Guid? id = null)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código de la unidad organizativa es obligatorio.", nameof(codigo));
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la unidad organizativa es obligatorio.", nameof(nombre));

        return new UnidadOrganizativa
        {
            Id = id ?? Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Ciudad = ciudad?.Trim(),
            Direccion = direccion?.Trim(),
            Telefono = telefono?.Trim(),
            EsSedePrincipal = esSedePrincipal,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Actualizar(
        string nombre,
        string? ciudad,
        string? direccion,
        string? telefono,
        bool esSedePrincipal)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la unidad organizativa es obligatorio.", nameof(nombre));

        Nombre = nombre.Trim();
        Ciudad = ciudad?.Trim();
        Direccion = direccion?.Trim();
        Telefono = telefono?.Trim();
        EsSedePrincipal = esSedePrincipal;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Desactivar()
    {
        Activo = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activar()
    {
        Activo = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
