using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Matriz de disponibilidad territorial de un Servicio en una Sucursal / Sede.
/// </summary>
public class SucursalServicio : Entity<Guid>
{
    public Guid SucursalId { get; private set; }
    public Guid ServicioId { get; private set; }
    public bool Habilitado { get; private set; } = true;

    private SucursalServicio() { }

    public static SucursalServicio Crear(Guid sucursalId, Guid servicioId, bool habilitado = true)
    {
        return new SucursalServicio
        {
            Id = Guid.NewGuid(),
            SucursalId = sucursalId,
            ServicioId = servicioId,
            Habilitado = habilitado
        };
    }

    public void EstablecerHabilitado(bool habilitado) => Habilitado = habilitado;
}
