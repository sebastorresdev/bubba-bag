using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

public record UnidadMedidaDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string Abreviatura,
    string? Descripcion,
    bool Activo
);
