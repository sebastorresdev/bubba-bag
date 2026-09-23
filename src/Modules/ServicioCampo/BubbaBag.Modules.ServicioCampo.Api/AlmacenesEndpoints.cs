using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ActualizarAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CambiarEstadoAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenPorId;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenes;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerStockTecnicos;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class AlmacenesEndpoints
{
    public static void MapAlmacenesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventario/almacenes")
            .WithTags("Servicio de Campo - Almacenes y Bodegas")
            .RequireAuthorization();

        group.MapGet("/", ObtenerAlmacenes);
        group.MapGet("/{id:guid}", ObtenerAlmacenPorId);
        group.MapPost("/", CrearAlmacen);
        group.MapPut("/{id:guid}", ActualizarAlmacen);
        group.MapPatch("/{id:guid}/estado", CambiarEstadoAlmacen);

        // Stock por técnico (almacenes móviles)
        var stockGroup = app.MapGroup("/api/inventario/stock")
            .WithTags("Servicio de Campo - Stock")
            .RequireAuthorization();

        stockGroup.MapGet("/tecnicos", ObtenerStockTecnicos);
    }

    private static async Task<IResult> ObtenerStockTecnicos(
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerStockTecnicosQuery(soloActivos ?? true));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerAlmacenes(
        TipoAlmacen? tipo,
        Guid? sucursalId,
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerAlmacenesQuery(tipo, sucursalId, soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerAlmacenPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerAlmacenPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> CrearAlmacen(
        CrearAlmacenRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearAlmacenCommand(
            request.Codigo,
            request.Nombre,
            request.Tipo,
            request.SucursalId,
            request.Direccion,
            request.Telefono,
            request.RecursoTecnicoId
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/almacenes/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarAlmacen(
        Guid id,
        ActualizarAlmacenRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarAlmacenCommand(id, request.Nombre, request.Direccion, request.Telefono, request.SucursalId);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoAlmacen(
        Guid id,
        CambiarEstadoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoAlmacenCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
    }
}

public record CrearAlmacenRequest(
    string Codigo,
    string Nombre,
    TipoAlmacen Tipo,
    Guid? SucursalId,
    string? Direccion,
    string? Telefono,
    Guid? RecursoTecnicoId
);

public record ActualizarAlmacenRequest(
    string Nombre,
    string? Direccion,
    string? Telefono,
    Guid? SucursalId
);

public record CambiarEstadoRequest(bool Activo);
