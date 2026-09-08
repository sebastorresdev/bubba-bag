namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;

public enum AutomatizacionMarcacion
{
    Ninguna = 0,                        // Requiere marcas físicas reales
    CompletarSalidaAutomatica = 1,      // Para personal de campo (completa salida al final de la jornada)
    CompletarJornadaAutomatica = 2      // Para personal de confianza / dirección (no fiscalizados)
}
