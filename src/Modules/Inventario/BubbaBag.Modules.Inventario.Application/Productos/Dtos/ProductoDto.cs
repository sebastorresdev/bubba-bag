using System;

namespace BubbaBag.Modules.Inventario.Application.Productos.Dtos;

public record ProductoDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    string Categoria,
    string UnidadMedida,
    bool EsSerializado,
    bool Activo
);
