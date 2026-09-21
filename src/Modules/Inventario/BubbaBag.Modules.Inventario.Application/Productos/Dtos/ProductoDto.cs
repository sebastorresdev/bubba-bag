using System;
using BubbaBag.Modules.Inventario.Domain.Productos;

namespace BubbaBag.Modules.Inventario.Application.Productos.Dtos;

public record ProductoDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    TipoProducto Tipo,
    decimal PrecioBase,
    Guid? CatalogoId,
    string Categoria,
    string UnidadMedida,
    bool EsSerializado,
    bool Activo
);
