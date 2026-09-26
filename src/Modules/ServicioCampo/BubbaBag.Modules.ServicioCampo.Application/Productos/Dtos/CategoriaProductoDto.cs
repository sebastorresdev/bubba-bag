using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

public record CategoriaProductoDto(
    Guid Id,
    string Nombre,
    Guid? CategoriaPadreId,
    string? CategoriaPadreNombre,
    string? Descripcion,
    bool Activo
);
