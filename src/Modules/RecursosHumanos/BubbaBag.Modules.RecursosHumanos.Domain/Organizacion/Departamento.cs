using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;

public class Departamento : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public bool Activo { get; private set; }

    private readonly List<Cargo> _cargos = new();
    public IReadOnlyCollection<Cargo> Cargos => _cargos.AsReadOnly();

    private Departamento() { }

    public Departamento(Guid id, string nombre, string? descripcion = null)
    {
        Id = id;
        Nombre = nombre.Trim();
        Descripcion = descripcion?.Trim();
        Activo = true;
    }

    public static Departamento Crear(string nombre, string? descripcion = null)
    {
        return new Departamento(Guid.NewGuid(), nombre, descripcion);
    }

    public void Actualizar(string nombre, string? descripcion)
    {
        Nombre = nombre.Trim();
        Descripcion = descripcion?.Trim();
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
