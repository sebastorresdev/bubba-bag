using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.DispositivosYLugares;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Marcaciones;

/// <summary>
/// Registro inmutable del evento de marcación (físico, móvil, web, etc.) para auditoría.
/// </summary>
public class MarcacionCruda : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public DateTimeOffset FechaHora { get; private set; }

    public Guid? DispositivoMarcacionId { get; private set; }
    public DispositivoMarcacion? DispositivoMarcacion { get; private set; }

    public Guid? LugarMarcacionId { get; private set; }
    public LugarMarcacion? LugarMarcacion { get; private set; }

    public TipoMarca TipoMarca { get; private set; } = TipoMarca.DesconocidoAuto;
    public OrigenMarca Origen { get; private set; } = OrigenMarca.Biometrico;
    public MetodoAutenticacion MetodoAutenticacion { get; private set; } = MetodoAutenticacion.Huella;

    // Evidencias para marcación móvil o remota
    public string? FotoUrl { get; private set; }
    public double? Latitud { get; private set; }
    public double? Longitud { get; private set; }

    // Filtros de validez (ej. debounce de 3 min, fuera de geocerca)
    public bool EsValida { get; private set; } = true;
    public string? ObservacionDescarte { get; private set; }

    public bool Procesado { get; private set; } = false;

    private MarcacionCruda() { }

    public MarcacionCruda(
        Guid id,
        Guid empleadoId,
        DateTimeOffset fechaHora,
        TipoMarca tipoMarca,
        OrigenMarca origen,
        MetodoAutenticacion metodoAutenticacion,
        Guid? dispositivoMarcacionId = null,
        Guid? lugarMarcacionId = null,
        string? fotoUrl = null,
        double? latitud = null,
        double? longitud = null)
    {
        Id = id;
        EmpleadoId = empleadoId;
        FechaHora = fechaHora;
        TipoMarca = tipoMarca;
        Origen = origen;
        MetodoAutenticacion = metodoAutenticacion;
        DispositivoMarcacionId = dispositivoMarcacionId;
        LugarMarcacionId = lugarMarcacionId;
        FotoUrl = fotoUrl?.Trim();
        Latitud = latitud;
        Longitud = longitud;
        EsValida = true;
        Procesado = false;
    }

    public void MarcarComoDuplicadaOInvalida(string motivo)
    {
        EsValida = false;
        ObservacionDescarte = motivo.Trim();
    }

    public void MarcarComoProcesada()
    {
        Procesado = true;
    }
}
