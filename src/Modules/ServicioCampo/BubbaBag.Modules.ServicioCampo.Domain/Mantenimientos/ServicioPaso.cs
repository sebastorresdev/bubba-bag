using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

public enum TipoEvidenciaPaso
{
    Check = 1,
    Foto = 2,
    Texto = 3,
    Firma = 4
}

/// <summary>
/// Tarea / Paso individual de la plantilla de un Servicio.
/// Ejemplos: 'Verificar solicitud', 'Tomar foto de decos activados', 'Registrar clave'.
/// </summary>
public class ServicioPaso : Entity<Guid>
{
    public Guid ServicioId { get; private set; }
    public int NumeroPaso { get; private set; }
    public string Descripcion { get; private set; } = default!;
    public bool RequiereFoto { get; private set; }
    public TipoEvidenciaPaso TipoEvidencia { get; private set; } = TipoEvidenciaPaso.Check;
    public bool EsObligatorio { get; private set; } = true;

    private ServicioPaso() { }

    public static ServicioPaso Crear(
        Guid servicioId,
        int numeroPaso,
        string descripcion,
        bool requiereFoto = false,
        TipoEvidenciaPaso tipoEvidencia = TipoEvidenciaPaso.Check,
        bool esObligatorio = true)
    {
        return new ServicioPaso
        {
            Id = Guid.NewGuid(),
            ServicioId = servicioId,
            NumeroPaso = numeroPaso,
            Descripcion = descripcion.Trim(),
            RequiereFoto = requiereFoto || tipoEvidencia == TipoEvidenciaPaso.Foto,
            TipoEvidencia = requiereFoto ? TipoEvidenciaPaso.Foto : tipoEvidencia,
            EsObligatorio = esObligatorio
        };
    }

    public void Actualizar(
        int numeroPaso,
        string descripcion,
        bool requiereFoto,
        TipoEvidenciaPaso tipoEvidencia,
        bool esObligatorio)
    {
        NumeroPaso = numeroPaso;
        Descripcion = descripcion.Trim();
        RequiereFoto = requiereFoto || tipoEvidencia == TipoEvidenciaPaso.Foto;
        TipoEvidencia = requiereFoto ? TipoEvidenciaPaso.Foto : tipoEvidencia;
        EsObligatorio = esObligatorio;
    }
}
