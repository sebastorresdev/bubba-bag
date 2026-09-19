using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;

public class Sucursal : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Ciudad { get; private set; }
    public string? Direccion { get; private set; }
    public string? Telefono { get; private set; }
    public bool EsSedePrincipal { get; private set; }
    public bool Activo { get; private set; }

    private Sucursal() { }

    public Sucursal(
        Guid id,
        string codigo,
        string nombre,
        string? ciudad = null,
        string? direccion = null,
        string? telefono = null,
        bool esSedePrincipal = false)
    {
        Id = id;
        Codigo = codigo.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        Ciudad = ciudad?.Trim();
        Direccion = direccion?.Trim();
        Telefono = telefono?.Trim();
        EsSedePrincipal = esSedePrincipal;
        Activo = true;
    }

    public static Sucursal Crear(
        string codigo,
        string nombre,
        string? ciudad = null,
        string? direccion = null,
        string? telefono = null,
        bool esSedePrincipal = false)
    {
        return new Sucursal(Guid.NewGuid(), codigo, nombre, ciudad, direccion, telefono, esSedePrincipal);
    }

    public void Actualizar(
        string nombre,
        string? ciudad,
        string? direccion,
        string? telefono,
        bool esSedePrincipal)
    {
        Nombre = nombre.Trim();
        Ciudad = ciudad?.Trim();
        Direccion = direccion?.Trim();
        Telefono = telefono?.Trim();
        EsSedePrincipal = esSedePrincipal;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
