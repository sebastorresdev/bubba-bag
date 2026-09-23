using System;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

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
