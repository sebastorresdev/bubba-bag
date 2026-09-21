using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.Ventas.Application.ListasPrecio.Dtos;

public record ListaPrecioDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    string Moneda,
    DateTime? VigenciaDesde,
    DateTime? VigenciaHasta,
    bool EsPredeterminada,
    Guid? ClienteId,
    bool Activo,
    int TotalItems
);

public record ListaPrecioDetalleDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    string Moneda,
    DateTime? VigenciaDesde,
    DateTime? VigenciaHasta,
    bool EsPredeterminada,
    Guid? ClienteId,
    bool Activo,
    List<ListaPrecioItemDto> Items
);

public record ListaPrecioItemDto(
    Guid Id,
    Guid ListaPrecioId,
    Guid ProductoId,
    string? ProductoCodigo,
    string? ProductoNombre,
    string? ProductoTipo,
    decimal PrecioUnitario
);

public record GuardarItemListaPrecioRequest(
    Guid ProductoId,
    decimal PrecioUnitario
);

public record PrecioResueltoDto(
    Guid ProductoId,
    decimal PrecioUnitario,
    string OrigenPrecio // "ListaPrecio" o "PrecioBase"
);
