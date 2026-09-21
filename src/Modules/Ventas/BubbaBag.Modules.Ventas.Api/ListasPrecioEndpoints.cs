using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BubbaBag.Modules.Ventas.Application.ListasPrecio.Commands;
using BubbaBag.Modules.Ventas.Application.ListasPrecio.Dtos;
using BubbaBag.Modules.Ventas.Application.ListasPrecio.Queries;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.Ventas.Api;

public static class ListasPrecioEndpoints
{
    public static void MapVentasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ventas/listas-precio")
            .WithTags("Ventas - Listas de Precios")
            .RequireAuthorization();

        group.MapGet("/", ObtenerListasPrecio);
        group.MapGet("/{id:guid}", ObtenerListaPrecioPorId);
        group.MapPost("/", CrearListaPrecio);
        group.MapPut("/{id:guid}", ActualizarListaPrecio);
        group.MapPatch("/{id:guid}/estado", CambiarEstadoListaPrecio);
    }

    private static async Task<IResult> ObtenerListasPrecio(
        string? search,
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerListasPrecioQuery(search, soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerListaPrecioPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerListaPrecioPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> CrearListaPrecio(
        CrearListaPrecioRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearListaPrecioCommand(
            request.Nombre,
            request.Moneda ?? "PEN",
            request.Descripcion,
            request.VigenciaDesde,
            request.VigenciaHasta,
            request.EsPredeterminada,
            request.ClienteId,
            request.Items
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/ventas/listas-precio/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarListaPrecio(
        Guid id,
        ActualizarListaPrecioRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarListaPrecioCommand(
            id,
            request.Nombre,
            request.Moneda ?? "PEN",
            request.Descripcion,
            request.VigenciaDesde,
            request.VigenciaHasta,
            request.EsPredeterminada,
            request.ClienteId,
            request.Items
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Lista de precios actualizada correctamente." })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoListaPrecio(
        Guid id,
        CambiarEstadoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoListaPrecioCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Lista de precios {(request.Activo ? "activada" : "desactivada")} correctamente." })
            : Results.BadRequest(result.Error);
    }
}

public record CrearListaPrecioRequest(
    string Nombre,
    string? Moneda,
    string? Descripcion,
    DateTime? VigenciaDesde,
    DateTime? VigenciaHasta,
    bool EsPredeterminada,
    Guid? ClienteId,
    List<GuardarItemListaPrecioRequest>? Items
);

public record ActualizarListaPrecioRequest(
    string Nombre,
    string? Moneda,
    string? Descripcion,
    DateTime? VigenciaDesde,
    DateTime? VigenciaHasta,
    bool EsPredeterminada,
    Guid? ClienteId,
    List<GuardarItemListaPrecioRequest>? Items
);

public record CambiarEstadoRequest(bool Activo);
