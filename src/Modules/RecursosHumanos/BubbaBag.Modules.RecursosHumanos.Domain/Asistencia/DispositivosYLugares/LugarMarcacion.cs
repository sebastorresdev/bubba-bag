using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.DispositivosYLugares;

public class LugarMarcacion : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Direccion { get; private set; }
    public string ZonaHoraria { get; private set; } = "America/Lima";
    
    // Coordenadas geográficas para geocerca (opcional)
    public double? Latitud { get; private set; }
    public double? Longitud { get; private set; }
    public int? RadioMetros { get; private set; }
    public bool Activo { get; private set; } = true;

    private LugarMarcacion() { }

    public LugarMarcacion(
        Guid id,
        string codigo,
        string nombre,
        string? direccion = null,
        string zonaHoraria = "America/Lima",
        double? latitud = null,
        double? longitud = null,
        int? radioMetros = 100)
    {
        Id = id;
        Codigo = codigo.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        Direccion = direccion?.Trim();
        ZonaHoraria = string.IsNullOrWhiteSpace(zonaHoraria) ? "America/Lima" : zonaHoraria.Trim();
        Latitud = latitud;
        Longitud = longitud;
        RadioMetros = radioMetros;
        Activo = true;
    }

    public void Actualizar(
        string nombre,
        string? direccion,
        string zonaHoraria,
        double? latitud,
        double? longitud,
        int? radioMetros)
    {
        Nombre = nombre.Trim();
        Direccion = direccion?.Trim();
        ZonaHoraria = string.IsNullOrWhiteSpace(zonaHoraria) ? "America/Lima" : zonaHoraria.Trim();
        Latitud = latitud;
        Longitud = longitud;
        RadioMetros = radioMetros;
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
    }
}
