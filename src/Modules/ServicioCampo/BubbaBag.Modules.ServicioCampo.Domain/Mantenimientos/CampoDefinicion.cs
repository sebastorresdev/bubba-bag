using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

public enum TipoDatoCampo
{
    Texto = 1,
    Numero = 2,
    Fecha = 3,
    Booleano = 4,
    Opciones = 5
}

/// <summary>
/// Definición de un metadato o campo dinámico específico para un Tipo de Orden de Trabajo.
/// Ejemplos: 'Agencia de Destino', 'Contacto en Sitio', 'Nro de Guía'.
/// </summary>
public class CampoDefinicion : Entity<Guid>
{
    public Guid TipoOrdenTrabajoId { get; private set; }
    public string Clave { get; private set; } = default!;       // 'agencia_destino'
    public string Etiqueta { get; private set; } = default!;    // 'Agencia de Destino'
    public TipoDatoCampo TipoDato { get; private set; }         // Texto, Numero, Fecha, etc.
    public string? OpcionesJson { get; private set; }           // '["Cruz del Sur", "Olva", "Shalom"]'
    public bool EsObligatorio { get; private set; }
    public int OrdenVisual { get; private set; }
    public bool Activo { get; private set; }

    private CampoDefinicion() { }

    public static CampoDefinicion Crear(
        Guid tipoOrdenTrabajoId,
        string clave,
        string etiqueta,
        TipoDatoCampo tipoDato = TipoDatoCampo.Texto,
        bool esObligatorio = false,
        string? opcionesJson = null,
        int ordenVisual = 0)
    {
        return new CampoDefinicion
        {
            Id = Guid.NewGuid(),
            TipoOrdenTrabajoId = tipoOrdenTrabajoId,
            Clave = clave.Trim().ToLowerInvariant(),
            Etiqueta = etiqueta.Trim(),
            TipoDato = tipoDato,
            EsObligatorio = esObligatorio,
            OpcionesJson = opcionesJson?.Trim(),
            OrdenVisual = ordenVisual,
            Activo = true
        };
    }

    public void Actualizar(
        string etiqueta,
        TipoDatoCampo tipoDato,
        bool esObligatorio,
        string? opcionesJson,
        int ordenVisual)
    {
        Etiqueta = etiqueta.Trim();
        TipoDato = tipoDato;
        EsObligatorio = esObligatorio;
        OpcionesJson = opcionesJson?.Trim();
        OrdenVisual = ordenVisual;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
