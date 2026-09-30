using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ActualizarAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CambiarEstadoAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenPorId;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenes;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerResumenStockAlmacenes;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerInventarioProductos;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearTransferenciaInventario;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciasInventario;
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

        var stockGroup = app.MapGroup("/api/inventario/stock")
            .WithTags("Servicio de Campo - Stock")
            .RequireAuthorization();
        stockGroup.MapGet("/almacenes", ObtenerResumenStockAlmacenes);
        stockGroup.MapGet("/productos", ObtenerInventarioProductos);

        var transferenciasGroup = app.MapGroup("/api/inventario/transferencias")
            .WithTags("Servicio de Campo - Transferencias")
            .RequireAuthorization();
        transferenciasGroup.MapGet("/", ObtenerTransferencias);
        transferenciasGroup.MapPost("/", CrearTransferencia);
    }

    private static async Task<IResult> ObtenerTransferencias(IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTransferenciasInventarioQuery());
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CrearTransferencia(
        CrearTransferenciaRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearTransferenciaInventarioCommand(
            request.AlmacenOrigenId,
            request.AlmacenDestinoId,
            request.Lineas.Select(linea => new LineaTransferenciaInventario(linea.ProductoId, linea.Cantidad)).ToList(),
            request.Observacion);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/transferencias/{result.Value}", new { numero = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerInventarioProductos(
        Guid? almacenId,
        string? buscar,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerInventarioProductosQuery(almacenId, buscar));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerResumenStockAlmacenes(
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerResumenStockAlmacenesQuery(soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerAlmacenes(
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerAlmacenesQuery(soloActivos));
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
            request.Nombre,
            request.Descripcion
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
        var command = new ActualizarAlmacenCommand(id, request.Nombre, request.Descripcion);
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
    string Nombre,
    string? Descripcion = null
);

public record ActualizarAlmacenRequest(
    string Nombre,
    string? Descripcion = null
);

public record CambiarEstadoRequest(bool Activo);

public record CrearTransferenciaRequest(
    Guid AlmacenOrigenId,
    Guid AlmacenDestinoId,
    IReadOnlyCollection<CrearTransferenciaLineaRequest> Lineas,
    string? Observacion = null);

public record CrearTransferenciaLineaRequest(Guid ProductoId, decimal Cantidad);
