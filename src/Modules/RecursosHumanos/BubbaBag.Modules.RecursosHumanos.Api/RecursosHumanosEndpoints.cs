using System;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features;
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.RecursosHumanos.Api;

public static class RecursosHumanosEndpoints
{
    public static void MapRecursosHumanosEndpoints(this IEndpointRouteBuilder app)
    {
        var rootGroup = app.MapGroup("/api/rrhh")
            .WithTags("Recursos Humanos")
            .RequireAuthorization(p => p.RequireRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhModulo));

        // Catálogos
        rootGroup.MapGet("/catalogos", ObtenerCatalogos);

        // Empleados
        var empleadosGroup = rootGroup.MapGroup("/empleados");

        empleadosGroup.MapGet("/", ObtenerEmpleados);
        empleadosGroup.MapGet("/{id:guid}", ObtenerEmpleadoPorId);
        empleadosGroup.MapPost("/", CrearEmpleado);
        empleadosGroup.MapPut("/{id:guid}", ActualizarEmpleado);
        empleadosGroup.MapPost("/{id:guid}/baja", DarDeBajaEmpleado);
        empleadosGroup.MapPost("/{id:guid}/reactivar", ReactivarEmpleado);
        empleadosGroup.MapDelete("/{id:guid}", EliminarEmpleado)
            .RequireAuthorization(p => p.RequireRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhConfidencial));
    }

    private static async Task<IResult> ObtenerCatalogos(IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerCatalogosRrhhQuery());
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerEmpleados(
        IDispatcher dispatcher,
        string? searchTerm,
        EstadoEmpleado? estado,
        Guid? departamentoId,
        Guid? cargoId,
        int page = 1,
        int pageSize = 20)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadosQuery(searchTerm, estado, departamentoId, cargoId, page, pageSize));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerEmpleadoPorId(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadoQuery(id));
        if (result.IsFailure)
        {
            return Results.NotFound(new BubbaBag.SharedKernel.Http.ErrorResponse(404, "Colaborador no encontrado", result.Error));
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
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
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
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Identificador inválido", "El ID de la ruta no coincide con el del cuerpo de la solicitud."));
        }

        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> DarDeBajaEmpleado(
        IDispatcher dispatcher,
        Guid id,
        DarDeBajaRequest request)
    {
        var command = new DarDeBajaEmpleadoCommand(id, request.FechaCese, request.MotivoCese, request.ObservacionesCese);
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al dar de baja", result.Error));
        }
        return Results.Ok(new { Id = result.Value, Mensaje = "Colaborador dado de baja exitosamente." });
    }

    private static async Task<IResult> ReactivarEmpleado(
        IDispatcher dispatcher,
        Guid id)
    {
        var command = new ReactivarEmpleadoCommand(id);
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al reactivar colaborador", result.Error));
        }
        return Results.Ok(new { Id = result.Value, Mensaje = "Colaborador reactivado exitosamente." });
    }

    private static async Task<IResult> EliminarEmpleado(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.SendAsync(new EliminarEmpleadoCommand(id));
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Operación no permitida", result.Error));
        }
        return Results.NoContent();
    }
}

public record DarDeBajaRequest(DateOnly FechaCese, string MotivoCese, string? ObservacionesCese);
