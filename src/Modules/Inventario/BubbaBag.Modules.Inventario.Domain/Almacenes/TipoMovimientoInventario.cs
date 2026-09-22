namespace BubbaBag.Modules.Inventario.Domain.Almacenes;

/// <summary>
/// Tipos de transacción física de entrada, salida o traslado en el Kardex de inventario.
/// </summary>
public enum TipoMovimientoInventario
{
    /// <summary>
    /// Recepción inicial de mercancía o equipos provistos por DIRECTV / Proveedor.
    /// </summary>
    IngresoProveedor = 1,

    /// <summary>
    /// Traslado entre dos almacenes físicos (ej. Lima a Huaraz).
    /// </summary>
    TransferenciaAlmacenes = 2,

    /// <summary>
    /// Despacho de bodega base a la camioneta del técnico (Almacén Móvil).
    /// </summary>
    DespachoATecnico = 3,

    /// <summary>
    /// Devolución de materiales sobrantes o equipos no instalados por el técnico a la bodega base.
    /// </summary>
    DevolucionTecnico = 4,

    /// <summary>
    /// Consumo o instalación definitiva de materiales / equipos en la casa del cliente (asociado a una OT).
    /// </summary>
    ConsumoEnOrdenTrabajo = 5,

    /// <summary>
    /// Retiro de equipo averiado de la casa del cliente durante una visita técnica.
    /// </summary>
    RetiroEnOrdenTrabajo = 6,

    /// <summary>
    /// Ajuste de inventario por toma física / conteo cíclico (sobrante o faltante).
    /// </summary>
    AjusteInventario = 7,

    /// <summary>
    /// Devolución formal de equipos en garantía / averiados hacia DIRECTV.
    /// </summary>
    DevolucionAProveedor = 8
}
