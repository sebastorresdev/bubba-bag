namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Modalidad de ejecución del movimiento de transferencia.
/// </summary>
public enum ModalidadTransferencia
{
    /// <summary>
    /// Movimiento presencial en ventanilla (entrega mano a mano dentro de la misma unidad).
    /// Impacta de inmediato origen y destino sin requerir recepción diferida.
    /// </summary>
    Inmediata = 1,

    /// <summary>
    /// Mercadería que viaja con guía/transportista entre sedes físicas.
    /// Queda en tránsito hasta que el almacén de destino confirme la recepción física.
    /// </summary>
    ConTransito = 2
}
