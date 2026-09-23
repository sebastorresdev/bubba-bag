using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerProductoPorId;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerProductos;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class ProductosEndpoints
{
    public static void MapProductosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventario/productos")
            .WithTags("Servicio de Campo - Catálogo de Materiales y Equipos")
            .RequireAuthorization();

        group.MapGet("/", ObtenerProductos);
        group.MapGet("/{id:guid}", ObtenerProductoPorId);
        group.MapPost("/", CrearProducto);
        group.MapPut("/{id:guid}", ActualizarProducto);
        group.MapPatch("/{id:guid}/estado", CambiarEstadoProducto);
    }

    private static async Task<IResult> ObtenerProductos(
        string? search,
        string? categoria,
        TipoProducto? tipo,
        Guid? catalogoId,
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerProductosQuery(search, categoria, tipo, catalogoId, soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerProductoPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerProductoPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> CrearProducto(
        CrearProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearProductoCommand(
            request.Codigo,
            request.Nombre,
            request.Tipo ?? TipoProducto.Inventario,
            request.PrecioBase ?? 0m,
            request.CatalogoId,
            request.Categoria ?? "Materiales",
            request.UnidadMedida ?? "Unidades",
            request.EsSerializado,
            request.Descripcion
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/productos/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarProducto(
        Guid id,
        ActualizarProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarProductoCommand(
            id,
            request.Nombre,
            request.Categoria ?? "Materiales",
            request.UnidadMedida ?? "Unidades",
            request.EsSerializado,
            request.Descripcion,
            request.Tipo ?? TipoProducto.Inventario,
            request.PrecioBase ?? 0m,
            request.CatalogoId
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoProducto(
        Guid id,
        CambiarEstadoProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoProductoCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
    }
}

public record CrearProductoRequest(
    string Codigo,
    string Nombre,
    TipoProducto? Tipo,
    decimal? PrecioBase,
    Guid? CatalogoId,
    string? Categoria,
    string? UnidadMedida,
    bool EsSerializado,
    string? Descripcion
);

public record ActualizarProductoRequest(
    string Nombre,
    TipoProducto? Tipo,
    decimal? PrecioBase,
    Guid? CatalogoId,
    string? Categoria,
    string? UnidadMedida,
    bool EsSerializado,
    string? Descripcion
);

public record CambiarEstadoProductoRequest(bool Activo);
