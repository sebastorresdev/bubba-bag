using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;

public class PatronCiclico : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public int DiasCiclo { get; private set; }
    public bool Activo { get; private set; } = true;

    private readonly List<PatronCiclicoDetalle> _detalles = new();
    public IReadOnlyCollection<PatronCiclicoDetalle> Detalles => _detalles.AsReadOnly();

    private PatronCiclico() { }

    public PatronCiclico(Guid id, string nombre, int diasCiclo)
    {
        Id = id;
        Nombre = nombre.Trim();
        DiasCiclo = Math.Max(1, diasCiclo);
        Activo = true;
    }

    public void Actualizar(string nombre, int diasCiclo)
    {
        Nombre = nombre.Trim();
        DiasCiclo = Math.Max(1, diasCiclo);
    }

    public void AgregarOActualizarDetalle(int diaOrden, Guid? turnoId, bool esDescanso)
    {
        if (diaOrden < 1 || diaOrden > DiasCiclo)
        {
            throw new ArgumentOutOfRangeException(nameof(diaOrden), $"El día orden debe estar entre 1 y {DiasCiclo}.");
        }

        var detalleExistente = _detalles.Find(d => d.DiaOrden == diaOrden);
        if (detalleExistente != null)
        {
            detalleExistente.Actualizar(turnoId, esDescanso);
        }
        else
        {
            _detalles.Add(new PatronCiclicoDetalle(Guid.NewGuid(), Id, diaOrden, turnoId, esDescanso));
        }
    }

    public void LimpiarDetalles()
    {
        _detalles.Clear();
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
    }
}
