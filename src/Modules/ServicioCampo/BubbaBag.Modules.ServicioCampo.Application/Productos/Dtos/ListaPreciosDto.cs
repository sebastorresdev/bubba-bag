using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

public record ListaPreciosDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string Moneda,
    string? Descripcion,
    DateTime? FechaInicio,
    DateTime? FechaFin,
    bool Activo,
    int CantidadElementos = 0
);

public record ElementoListaPreciosDto(
    Guid Id,
    Guid ListaPreciosId,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    Guid? UnidadMedidaId,
    string? UnidadMedidaNombre,
    decimal Monto,
    int MetodoFijacion
);
