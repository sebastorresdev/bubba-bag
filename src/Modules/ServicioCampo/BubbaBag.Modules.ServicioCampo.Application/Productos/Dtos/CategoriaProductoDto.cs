using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

public record CategoriaProductoDto(
    Guid Id,
    string Nombre,
    string? Familia,
    string? Descripcion,
    bool Activo
);
