using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.DispositivosYLugares;

public class DispositivoMarcacion : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public TipoDispositivo TipoDispositivo { get; private set; }
    public string? DireccionIp { get; private set; }
    public string? NumeroSerie { get; private set; }
    public Guid? LugarMarcacionId { get; private set; }
    public LugarMarcacion? LugarMarcacion { get; private set; }
    public bool Activo { get; private set; } = true;

    private DispositivoMarcacion() { }

    public DispositivoMarcacion(
        Guid id,
        string codigo,
        string nombre,
        TipoDispositivo tipoDispositivo,
        Guid? lugarMarcacionId = null,
        string? direccionIp = null,
        string? numeroSerie = null)
    {
        Id = id;
        Codigo = codigo.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        TipoDispositivo = tipoDispositivo;
        LugarMarcacionId = lugarMarcacionId;
        DireccionIp = direccionIp?.Trim();
        NumeroSerie = numeroSerie?.Trim();
        Activo = true;
    }

    public void Actualizar(
        string nombre,
        TipoDispositivo tipoDispositivo,
        Guid? lugarMarcacionId,
        string? direccionIp,
        string? numeroSerie)
    {
        Nombre = nombre.Trim();
        TipoDispositivo = tipoDispositivo;
        LugarMarcacionId = lugarMarcacionId;
        DireccionIp = direccionIp?.Trim();
        NumeroSerie = numeroSerie?.Trim();
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
    }
}
