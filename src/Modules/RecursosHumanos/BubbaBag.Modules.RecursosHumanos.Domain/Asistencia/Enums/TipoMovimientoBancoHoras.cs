namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;

public enum TipoMovimientoBancoHoras
{
    AcumulacionHorasExtra = 1,     // Suma minutos a favor del empleado
    CompensacionDescanso = 2,      // Resta minutos utilizados en tiempo libre
    AjusteManual = 3,              // Corrección auditada por RRHH
    VencimientoLegal = 4           // Caducidad de horas no compensadas según plazo de ley
}
