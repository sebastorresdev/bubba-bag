using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System;
using System.Threading.Tasks;

namespace BubbaBag.Modules.RecursosHumanos.Api;

public static class RecursosHumanosEndpoints
{
    public static void MapRecursosHumanosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/rrhh/empleados")
            .WithTags("Recursos Humanos")
            .RequireAuthorization(p => p.RequireRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhModulo));

        group.MapGet("/", ObtenerEmpleados);
        group.MapGet("/{id:guid}", ObtenerEmpleadoPorId);
        group.MapPost("/", CrearEmpleado);
        group.MapPut("/{id:guid}", ActualizarEmpleado);
        group.MapDelete("/{id:guid}", EliminarEmpleado)
            .RequireAuthorization(p => p.RequireRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhConfidencial));
    }

    private static async Task<IResult> ObtenerEmpleados(
        IDispatcher dispatcher,
        string? searchTerm,
        int page = 1,
        int pageSize = 20)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadosQuery(searchTerm, page, pageSize));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerEmpleadoPorId(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadoQuery(id));
        if (result.IsFailure)
        {
            return Results.NotFound(new { Error = result.Error });
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> CrearEmpleado(
        IDispatcher dispatcher,
        CrearEmpleadoCommand command)
    {
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new { Error = result.Error });
        }
        return Results.Created($"/api/rrhh/empleados/{result.Value}", result.Value);
    }

    private static async Task<IResult> ActualizarEmpleado(
        IDispatcher dispatcher,
        Guid id,
        ActualizarEmpleadoCommand command)
    {
        if (id != command.Id)
        {
            return Results.BadRequest(new { Error = "El ID de la ruta no coincide con el del body." });
        }

        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new { Error = result.Error });
        }
        return Results.NoContent();
    }

    private static async Task<IResult> EliminarEmpleado(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.SendAsync(new EliminarEmpleadoCommand(id));
        if (result.IsFailure)
        {
            return Results.BadRequest(new { Error = result.Error });
        }
        return Results.NoContent();
    }
}
