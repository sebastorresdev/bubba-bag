using System.Threading.Tasks;
using BubbaBag.Modules.Inventario.Application.Productos.Commands.CrearProducto;
using BubbaBag.Modules.Inventario.Application.Productos.Queries.ObtenerProductos;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.Inventario.Api;

public static class ProductosEndpoints
{
    public static void MapInventarioEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventario/productos")
            .WithTags("Inventario - Catálogo de Productos")
            .RequireAuthorization();

        group.MapGet("/", ObtenerProductos);
        group.MapPost("/", CrearProducto);
    }

    private static async Task<IResult> ObtenerProductos(
        string? search,
        string? categoria,
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerProductosQuery(search, categoria, soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CrearProducto(
        CrearProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearProductoCommand(
            request.Codigo,
            request.Nombre,
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
}

public record CrearProductoRequest(
    string Codigo,
    string Nombre,
    string? Categoria,
    string? UnidadMedida,
    bool EsSerializado,
    string? Descripcion
);
