namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record TransferenciaInventarioDto(
    Guid Id,
    string Numero,
    DateTime Fecha,
    Guid AlmacenOrigenId,
    string AlmacenOrigen,
    Guid AlmacenDestinoId,
    string AlmacenDestino,
    Guid ProductoId,
    string CodigoProducto,
    string Producto,
    decimal Cantidad,
    string? Unidad,
    string? Observacion
);
