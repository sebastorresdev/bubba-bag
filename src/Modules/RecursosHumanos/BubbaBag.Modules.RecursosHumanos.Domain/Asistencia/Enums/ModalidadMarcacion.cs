namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;

public enum ModalidadMarcacion
{
    DosMarcaciones = 2,                 // Entrada y Salida (refrigerio no se marca)
    CuatroMarcaciones = 4,              // Entrada, Salida Almuerzo, Retorno Almuerzo, Salida
    SoloEntrada = 1                     // Personal de campo que solo reporta inicio de ruta
}
