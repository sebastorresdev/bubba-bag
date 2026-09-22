namespace BubbaBag.Modules.Inventario.Domain.Productos;

/// <summary>
/// Ciclo de vida y custodia física de un equipo seriado (Decodificadores, Routers, ONTs, etc.).
/// </summary>
public enum EstadoItemSeriado
{
    /// <summary>
    /// Disponible físicamente en una bodega/almacén base para ser despachado.
    /// </summary>
    EnAlmacen = 1,

    /// <summary>
    /// Despachado y en custodia de un técnico en su camioneta/almacén móvil.
    /// </summary>
    EnCustodiaTecnico = 2,

    /// <summary>
    /// Instalado y operativo en el domicilio del cliente/abonado (vinculado a una OT).
    /// </summary>
    InstaladoEnCliente = 3,

    /// <summary>
    /// Retirado del cliente por avería, cambio de tecnología o corte, en custodia temporal del técnico.
    /// </summary>
    RetiradoPorAveria = 4,

    /// <summary>
    /// Retornado a bodega base en estado averiado/dañado, pendiente de garantía o envío a proveedor.
    /// </summary>
    AveriadoEnAlmacen = 5,

    /// <summary>
    /// Devuelto formalmente a la empresa contratante / proveedor (DIRECTV, etc.).
    /// </summary>
    DevueltoAProveedor = 6,

    /// <summary>
    /// Dado de baja definitiva por robo, siniestro o extravío.
    /// </summary>
    BajaPorPerdida = 7
}
