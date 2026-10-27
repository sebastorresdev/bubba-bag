using System.Collections.Generic;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class MotivosIncidenciaSeeder
{
    public static async Task SeedAsync(ServicioCampoDbContext context, ILogger? logger = null)
    {
        if (await context.MotivosIncidencia.AnyAsync())
        {
            return;
        }

        logger?.LogInformation("[MotivosIncidenciaSeeder] Sembrando catálogo inicial de motivos de incidencia...");

        var motivos = new List<MotivoIncidencia>
        {
            // Ámbito: Orden de Trabajo y Trabajos
            MotivoIncidencia.Crear("ORD-CAN-01", "Cliente desiste del servicio / contrato", AmbitoMotivo.OrdenTrabajo, "El abonado solicita no continuar con el servicio."),
            MotivoIncidencia.Crear("ORD-CAN-02", "Desestimado por coordinación / duplicado", AmbitoMotivo.OrdenTrabajo, "Orden generada por duplicidad o cancelada en mesa de control."),
            MotivoIncidencia.Crear("ORD-CAN-03", "No requerido en sitio tras evaluación", AmbitoMotivo.OrdenTrabajo, "Servicio o labor no necesaria tras la inspección técnica."),
            MotivoIncidencia.Crear("ORD-RECH-01", "Inviabilidad técnica o estructural en el predio", AmbitoMotivo.OrdenTrabajo, "Condiciones de infraestructura no permiten realizar la instalación."),
            MotivoIncidencia.Crear("ORD-RECH-02", "Cliente no autoriza perforación / ruta de cableado", AmbitoMotivo.OrdenTrabajo, "Abonado no consiente paso de cables o sujeciones."),
            MotivoIncidencia.Crear("ORD-RECH-03", "Falta de facilidades o acceso denegado", AmbitoMotivo.OrdenTrabajo, "Administración del edificio o terceros impiden ingreso al punto de trabajo."),
            MotivoIncidencia.Crear("ORD-RECH-04", "Riesgo de seguridad / Trabajo en altura no apto", AmbitoMotivo.OrdenTrabajo, "Condiciones inseguras para la cuadrilla técnica."),

            // Ámbito: Visitas
            MotivoIncidencia.Crear("VIS-01", "Cliente ausente en domicilio", AmbitoMotivo.Visita, "Nadie atiende en el predio tras agotar tiempos de espera."),
            MotivoIncidencia.Crear("VIS-02", "Cliente solicita reprogramación de fecha", AmbitoMotivo.Visita, "Abonado pide postergar la atención por motivos personales."),
            MotivoIncidencia.Crear("VIS-03", "Fuerza mayor / Factores climáticos adversos", AmbitoMotivo.Visita, "Lluvias torrenciales o emergencias que impiden traslado."),

            // Ámbito: Subtareas
            MotivoIncidencia.Crear("TAR-01", "Ductería o canalización obstruida", AmbitoMotivo.Tarea, "No es posible pasar cableado por canalización interna."),
            MotivoIncidencia.Crear("TAR-02", "Punto adicional cancelado por abonado", AmbitoMotivo.Tarea, "Cliente decide no habilitar decodificador o toma adicional.")
        };

        await context.MotivosIncidencia.AddRangeAsync(motivos);
        await context.SaveChangesAsync();

        logger?.LogInformation("[MotivosIncidenciaSeeder] Se insertaron {Count} motivos de incidencia iniciales.", motivos.Count);
    }
}
