using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Justificaciones;

public class TipoJustificacion : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public bool EsRemunerado { get; private set; } = true;
    public bool DescuentaTardanza { get; private set; } = true;
    public bool DescuentaFalta { get; private set; } = true;
    public bool RequiereDocumentoSustento { get; private set; } = false;
    public bool Activo { get; private set; } = true;

    private TipoJustificacion() { }

    public TipoJustificacion(
        Guid id,
        string codigo,
        string nombre,
        bool esRemunerado = true,
        bool descuentaTardanza = true,
        bool descuentaFalta = true,
        bool requiereDocumentoSustento = false)
    {
        Id = id;
        Codigo = codigo.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        EsRemunerado = esRemunerado;
        DescuentaTardanza = descuentaTardanza;
        DescuentaFalta = descuentaFalta;
        RequiereDocumentoSustento = requiereDocumentoSustento;
        Activo = true;
    }

    public void Actualizar(
        string nombre,
        bool esRemunerado,
        bool descuentaTardanza,
        bool descuentaFalta,
        bool requiereDocumentoSustento)
    {
        Nombre = nombre.Trim();
        EsRemunerado = esRemunerado;
        DescuentaTardanza = descuentaTardanza;
        DescuentaFalta = descuentaFalta;
        RequiereDocumentoSustento = requiereDocumentoSustento;
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
    }
}
