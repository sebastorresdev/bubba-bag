using System;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Application.Clientes.Features;
using BubbaBag.Modules.Crm.Application.Ubigeos.Features;
using BubbaBag.SharedKernel.Authorization;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.Crm.Api;

public static class CrmEndpoints
{
    public static void MapCrmEndpoints(this IEndpointRouteBuilder app)
    {
        var clientesGroup = app.MapGroup("/api/crm/clientes")
            .WithTags("CRM y Clientes")
            .RequireAuthorization();

        // Tabla de contenidos de rutas (Named Static Handlers sin lambdas anónimas)
        clientesGroup.MapGet("/", ObtenerClientes)
            .RequireAuthorization(Permissions.Crm.ClientesVer);

        clientesGroup.MapGet("/{id:guid}", ObtenerClientePorId)
            .RequireAuthorization(Permissions.Crm.ClientesVer);

        clientesGroup.MapPost("/", CrearCliente)
            .RequireAuthorization(Permissions.Crm.ClientesCrear);

        clientesGroup.MapPut("/{id:guid}", ActualizarCliente)
            .RequireAuthorization(Permissions.Crm.ClientesEditar);

        clientesGroup.MapPatch("/{id:guid}/estado", CambiarEstadoCliente)
            .RequireAuthorization(Permissions.Crm.ClientesEditar);

        var ubigeosGroup = app.MapGroup("/api/crm/ubigeos")
            .WithTags("Catálogo de Ubigeos")
            .RequireAuthorization();

        ubigeosGroup.MapGet("/", ObtenerUbigeos);
    }

    private static async Task<IResult> ObtenerUbigeos(
        IDispatcher dispatcher,
        string? departamento,
        string? provincia,
        string? search)
    {
        var query = new ObtenerUbigeosQuery(departamento, provincia, search);
        var result = await dispatcher.QueryAsync(query);
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerClientes(
        IDispatcher dispatcher,
        string? search,
        bool? soloFacturacion,
        bool? soloServicio,
        bool? soloActivos)
    {
        var query = new ObtenerClientesQuery(search, soloFacturacion, soloServicio, soloActivos);
        var result = await dispatcher.QueryAsync(query);
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerClientePorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerClientePorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearCliente(CrearClienteCommand command, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/crm/clientes/{result.Value}", new { id = result.Value, message = "Cliente registrado con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarCliente(Guid id, ActualizarClienteRequest request, IDispatcher dispatcher)
    {
        var command = new ActualizarClienteCommand(
            Id: id,
            TelefonoPrincipal: request.TelefonoPrincipal,
            Direccion: request.Direccion,
            UbigeoCodigo: request.UbigeoCodigo,
            ReferenciaUbicacion: request.ReferenciaUbicacion,
            CoordenadaLat: request.CoordenadaLat,
            CoordenadaLng: request.CoordenadaLng
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Cliente actualizado correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoCliente(Guid id, CambiarEstadoClienteRequest request, IDispatcher dispatcher)
    {
        var command = new CambiarEstadoClienteCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Cliente {(request.Activo ? "activado" : "desactivado")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }
}

public record ActualizarClienteRequest(
    string TelefonoPrincipal,
    string Direccion,
    string UbigeoCodigo,
    string? ReferenciaUbicacion = null,
    decimal? CoordenadaLat = null,
    decimal? CoordenadaLng = null);

public record CambiarEstadoClienteRequest(bool Activo);
