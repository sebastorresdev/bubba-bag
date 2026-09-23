using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Plantillas;

/// <summary>
/// Representa una tarea o paso técnico previsto dentro de una plantilla de trabajo.
/// Define el orden secuencial, su obligatoriedad y los requisitos de evidencia esperados.
/// </summary>
public class PlantillaTarea : Entity<Guid>
{
    public Guid PlantillaTrabajoId { get; private set; }
    public PlantillaTrabajo PlantillaTrabajo { get; private set; } = default!;

    public Guid TareaId { get; private set; }
    public Tarea Tarea { get; private set; } = default!;

    /// <summary>
    /// Orden o número de secuencia dentro del checklist (1, 2, 3...).
    /// </summary>
    public int OrdenSecuencia { get; private set; } = 1;

    /// <summary>
    /// Indica si el técnico no puede cerrar el trabajo sin haber completado esta tarea.
    /// </summary>
    public bool EsObligatoria { get; private set; } = true;

    /// <summary>
    /// Indica si se exige evidencia fotográfica para dar por validada esta tarea.
    /// </summary>
    public bool RequiereEvidencia { get; private set; }

    /// <summary>
    /// Instrucciones o notas técnicas específicas de esta tarea para el operario en campo.
    /// </summary>
    public string? Instrucciones { get; private set; }

    private PlantillaTarea() { }

    public static PlantillaTarea Crear(
        Guid plantillaTrabajoId,
        Guid TareaId,
        int ordenSecuencia,
        bool esObligatoria = true,
        bool requiereEvidencia = false,
        string? instrucciones = null)
    {
        return new PlantillaTarea
        {
            Id = Guid.NewGuid(),
            PlantillaTrabajoId = plantillaTrabajoId,
            TareaId = TareaId,
            OrdenSecuencia = Math.Max(1, ordenSecuencia),
            EsObligatoria = esObligatoria,
            RequiereEvidencia = requiereEvidencia,
            Instrucciones = instrucciones?.Trim()
        };
    }

    public void Modificar(
        int ordenSecuencia,
        bool esObligatoria,
        bool requiereEvidencia,
        string? instrucciones)
    {
        OrdenSecuencia = Math.Max(1, ordenSecuencia);
        EsObligatoria = esObligatoria;
        RequiereEvidencia = requiereEvidencia;
        Instrucciones = instrucciones?.Trim();
    }
}
