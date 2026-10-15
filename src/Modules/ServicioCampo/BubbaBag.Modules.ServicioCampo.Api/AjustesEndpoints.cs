using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Ajustes;
using BubbaBag.SharedKernel.Authorization;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class AjustesEndpoints
{
    public static void MapAjustesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventario/ajustes")
            .WithTags("Servicio de Campo - Ajustes de Inventario")
            .RequireAuthorization(Permissions.Inventario.Acceso);

        group.MapGet("/", ObtenerAjustes);
        group.MapGet("/{id:guid}", ObtenerAjustePorId);
        group.MapPost("/", CrearAjuste).RequireAuthorization(Permissions.Inventario.Operar);
        group.MapPost("/recuperar-local", RecuperarAjusteLocal).RequireAuthorization(Permissions.Inventario.Operar);
        group.MapPut("/{id:guid}", ActualizarAjuste).RequireAuthorization(Permissions.Inventario.Operar);
        group.MapPost("/{id:guid}/solicitar-aprobacion", SolicitarAprobacion).RequireAuthorization(Permissions.Inventario.Operar);
        group.MapPost("/{id:guid}/aplicar", AplicarAjuste).RequireAuthorization(Permissions.Inventario.AjustesAprobar);
        group.MapPost("/{id:guid}/rechazar", RechazarAjuste).RequireAuthorization(Permissions.Inventario.AjustesAprobar);
        group.MapPost("/{id:guid}/anular", AnularAjuste).RequireAuthorization(Permissions.Inventario.Operar);
        group.MapDelete("/{id:guid}", EliminarAjuste).RequireAuthorization(Permissions.Inventario.Operar);
    }

    private static async Task<IResult> ObtenerAjustes(Guid? almacenId, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerAjustesQuery(almacenId));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerAjustePorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerAjustePorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> CrearAjuste(GuardarAjusteInput datos, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new CrearAjusteCommand(datos));
        return result.IsSuccess
            ? Results.Created($"/api/inventario/ajustes/{result.Value.Id}", new { id = result.Value.Id, numero = result.Value.Numero })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarAjuste(Guid id, GuardarAjusteInput datos, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new ActualizarAjusteCommand(id, datos));
        return result.IsSuccess
            ? Results.Ok(new { id = result.Value.Id, numero = result.Value.Numero })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> SolicitarAprobacion(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new SolicitarAprobacionAjusteCommand(id));
        return result.IsSuccess
            ? Results.Ok(new { numeroAprobacion = result.Value.NumeroAprobacion })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> RecuperarAjusteLocal(RecuperarAjusteLocalRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new CrearAjusteCommand(request.Datos, request.RecuperacionId));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> AplicarAjuste(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new AplicarAjusteCommand(id));
        return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> RechazarAjuste(Guid id, RechazarAjusteRequest? request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new RechazarAjusteCommand(id, request?.Motivo));
        return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> AnularAjuste(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new AnularAjusteCommand(id));
        return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> EliminarAjuste(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new EliminarAjusteCommand(id));
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }
}

public record RecuperarAjusteLocalRequest(Guid RecuperacionId, GuardarAjusteInput Datos);
public record RechazarAjusteRequest(string? Motivo = null);
