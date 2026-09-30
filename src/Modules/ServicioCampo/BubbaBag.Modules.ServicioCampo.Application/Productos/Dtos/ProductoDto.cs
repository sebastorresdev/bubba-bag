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
    Guid? CategoriaProductoId,
    string? Categoria,
    Guid? GrupoUnidadMedidaId,
    string? NombreGrupoUnidadMedida,
    Guid? UnidadMedidaDefectoId,
    string? NombreUnidadMedidaDefecto,
    bool EsSerializado,
    bool Activo,
    string? CodigoBarras = null,
    string? Notas = null,
    decimal CostoActual = 0m,
    decimal CostoEstandar = 0m,
    bool AfectoImpuesto = true,
    string? ProveedorDefecto = null,
    Guid? ListaPreciosPredeterminadaId = null,
    string? ListaPreciosPredeterminadaNombre = null,
    int DecimalesCantidad = 0
);
