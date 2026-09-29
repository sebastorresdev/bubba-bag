using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record ResumenStockAlmacenDto(
    Guid AlmacenId,
    string NombreAlmacen,
    bool Activo,
    int TotalProductos,
    decimal TotalUnidades,
    int TotalSeries
);
