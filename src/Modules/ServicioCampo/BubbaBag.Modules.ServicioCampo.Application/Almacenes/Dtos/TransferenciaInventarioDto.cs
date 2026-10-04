using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record TransferenciaInventarioDto(
    Guid Id,
    string Numero,
    DateTime Fecha,
    Guid AlmacenOrigenId,
    string AlmacenOrigen,
    Guid AlmacenDestinoId,
    string AlmacenDestino,
    int TotalLineas,
    decimal TotalCantidad,
    string? Observacion,
    string Estado = "Cerrada",
    string Modalidad = "Inmediata",
    decimal CantidadRecibida = 0,
    decimal CantidadPendiente = 0,
    string? ResumenProductos = null
);
