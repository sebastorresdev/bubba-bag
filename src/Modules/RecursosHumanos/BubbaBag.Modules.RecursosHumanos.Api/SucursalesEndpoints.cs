using System;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Sucursales.Commands;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Sucursales.Dtos;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Sucursales.Queries;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.RecursosHumanos.Api;

public static class SucursalesEndpoints
{
    public static void MapSucursalesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/configuracion/sucursales")
            .WithTags("Configuración - Sucursales")
            .RequireAuthorization();

        group.MapGet("/", ObtenerSucursales);
        group.MapGet("/{id:guid}", ObtenerSucursalPorId);
        group.MapPost("/", CrearSucursal);
        group.MapPut("/{id:guid}", ActualizarSucursal);
        group.MapPatch("/{id:guid}/estado", CambiarEstadoSucursal);
    }

    private static async Task<IResult> ObtenerSucursales(
        bool? soloActivos,
        string? search,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerSucursalesQuery(soloActivos, search));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerSucursalPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerSucursalPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> CrearSucursal(
        CrearSucursalRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearSucursalCommand(
            request.Codigo,
            request.Nombre,
            request.Ciudad,
            request.Direccion,
            request.Telefono,
            request.EsSedePrincipal
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/configuracion/sucursales/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarSucursal(
        Guid id,
        ActualizarSucursalRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarSucursalCommand(
            id,
            request.Nombre,
            request.Ciudad,
            request.Direccion,
            request.Telefono,
            request.EsSedePrincipal
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoSucursal(
        Guid id,
        CambiarEstadoSucursalRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoSucursalCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }
}

public record CrearSucursalRequest(
    string Codigo,
    string Nombre,
    string? Ciudad = null,
    string? Direccion = null,
    string? Telefono = null,
    bool EsSedePrincipal = false
);

public record ActualizarSucursalRequest(
    string Nombre,
    string? Ciudad = null,
    string? Direccion = null,
    string? Telefono = null,
    bool EsSedePrincipal = false
);

public record CambiarEstadoSucursalRequest(bool Activo);
