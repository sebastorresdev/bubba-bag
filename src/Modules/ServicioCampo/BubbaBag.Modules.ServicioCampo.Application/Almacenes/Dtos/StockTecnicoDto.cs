using System;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

/// <summary>
/// Representa el stock de un producto en un almacén móvil (camioneta de técnico).
/// </summary>
public record StockTecnicoItemDto(
    Guid AlmacenId,
    string CodigoAlmacen,
    string NombreAlmacen,
    Guid? RecursoTecnicoId,
    bool AlmacenActivo,
    Guid ProductoId,
    string CodigoProducto,
    string NombreProducto,
    string Categoria,
    string UnidadMedida,
    bool EsSerializado,
    decimal CantidadDisponible,
    decimal CantidadReservada,
    decimal StockTotal
);

/// <summary>
/// Resumen agrupado de un almacén móvil con toda su carga actual.
/// </summary>
public record ResumenAlmacenMovilDto(
    Guid AlmacenId,
    string CodigoAlmacen,
    string NombreAlmacen,
    Guid? RecursoTecnicoId,
    bool Activo,
    int TotalProductos,
    decimal TotalUnidades,
    int TotalSeries
);
