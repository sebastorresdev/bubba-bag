namespace BubbaBag.Modules.ServicioCampo.Domain.Recursos;

/// <summary>
/// Tipos de Recursos Reservables en Servicio de Campo (estándar Dynamics 365 Bookable Resource Type).
/// </summary>
public enum TipoRecurso
{
    Tecnico = 1,       // Usuario / Técnico individual de campo
    Cuadrilla = 2,     // Equipo o cuadrilla formada por múltiples técnicos
    Almacen = 3,       // Instalación, depósito o almacén móvil asignable
    Despachador = 4,   // Usuario despachador / coordinador de servicios
    Territorio = 5,    // Recurso representativo de un territorio o zona de servicio
    Equipamiento = 6   // Maquinaria, vehículo especializado o herramienta pesada
}
