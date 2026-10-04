using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record InventarioProductoDto(
    Guid StockId,
    Guid ProductoId,
    string CodigoProducto,
    string NombreProducto,
    Guid AlmacenId,
    string NombreAlmacen,
    Guid? UnidadMedidaId,
    string? NombreUnidadMedida,
    decimal CantidadDisponible,
    decimal CantidadReservada,
    decimal CantidadTotal,
    decimal CostoActual,
    decimal ValorInventario,
    DateTime ActualizadoEn,
    bool EsSerializado = false, Guid UbicacionId = default, string NombreUbicacion = "", string Condicion = "Utilizable"
);
