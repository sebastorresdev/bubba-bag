using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;

public class Cargo : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public Guid DepartamentoId { get; private set; }
    public Departamento Departamento { get; private set; } = default!;
    public decimal? SalarioReferencial { get; private set; }
    public bool Activo { get; private set; }

    private Cargo() { }

    public Cargo(Guid id, string nombre, Guid departamentoId, decimal? salarioReferencial = null)
    {
        Id = id;
        Nombre = nombre.Trim();
        DepartamentoId = departamentoId;
        SalarioReferencial = salarioReferencial;
        Activo = true;
    }

    public static Cargo Crear(string nombre, Guid departamentoId, decimal? salarioReferencial = null)
    {
        return new Cargo(Guid.NewGuid(), nombre, departamentoId, salarioReferencial);
    }

    public void Actualizar(string nombre, Guid departamentoId, decimal? salarioReferencial)
    {
        Nombre = nombre.Trim();
        DepartamentoId = departamentoId;
        SalarioReferencial = salarioReferencial;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
