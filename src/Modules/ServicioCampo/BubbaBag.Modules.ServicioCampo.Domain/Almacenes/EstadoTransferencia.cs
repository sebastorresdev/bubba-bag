namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Estados de ciclo de vida de una transferencia de inventario.
/// </summary>
public enum EstadoTransferencia
{
    /// <summary>
    /// Documento en preparación. No modifica existencias en el inventario.
    /// </summary>
    Borrador = 1,

    /// <summary>
    /// Despacho confirmado. El stock fue descontado del origen y se encuentra en tránsito.
    /// </summary>
    EnTransito = 2,

    /// <summary>
    /// Una parte de la carga ingresó al destino, pero aún queda saldo pendiente en tránsito.
    /// </summary>
    ParcialmenteRecibida = 3,

    /// <summary>
    /// Transferencia completada: no existen saldos pendientes (todo fue recibido o resuelto).
    /// </summary>
    Cerrada = 4,

    /// <summary>
    /// Documento anulado antes de haber sido despachado.
    /// </summary>
    Cancelada = 5
}
