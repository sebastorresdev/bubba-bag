using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

public record UnidadMedidaDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string Abreviatura,
    bool PermiteDecimales,
    string? Descripcion,
    bool Activo
);
