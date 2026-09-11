namespace BubbaBag.Modules.FieldService.Domain.Enums;

/// <summary>
/// Macro-estados del ciclo de vida estándar (Estilo System Status de Microsoft Dynamics 365 Field Service).
/// Se utiliza para reportes ejecutivos, KPIs gerenciales y lógica central del ERP.
/// </summary>
public enum EstadoSistema
{
    Borrador = 1,
    PendienteProgramar = 2,
    Programado = 3,
    EnProgreso = 4,
    Completado = 5,
    Cancelado = 6
}
