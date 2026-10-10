using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Plantillas;
using BubbaBag.Modules.ServicioCampo.Application.Plantillas.Dtos;
using BubbaBag.SharedKernel.Authorization;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class PlantillasTrabajoEndpoints
{
    public static void MapPlantillasTrabajoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/serviciocampo/plantillas-trabajo")
            .WithTags("Servicio de Campo - Plantillas de Trabajo")
            .RequireAuthorization();

        group.MapGet("/", ObtenerPlantillas)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);

        group.MapGet("/{id:guid}", ObtenerPlantillaPorId)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);

        group.MapPost("/", CrearPlantilla)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        group.MapPut("/{id:guid}", ActualizarPlantilla)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        group.MapPatch("/{id:guid}/estado", CambiarEstadoPlantilla)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        group.MapDelete("/{id:guid}", EliminarPlantilla)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        // Catálogo de tareas atómicas
        var tareasGroup = app.MapGroup("/api/serviciocampo/tareas")
            .WithTags("Servicio de Campo - Tareas")
            .RequireAuthorization();

        tareasGroup.MapGet("/", ObtenerTareas)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);

        tareasGroup.MapGet("/{id:guid}", ObtenerTareaPorId)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);

        tareasGroup.MapPost("/", CrearTarea)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        tareasGroup.MapPut("/{id:guid}", ActualizarTarea)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        tareasGroup.MapDelete("/{id:guid}", EliminarTarea)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
    }

    private static async Task<IResult> ObtenerPlantillas(
        IDispatcher dispatcher,
        Guid? productoId,
        bool? soloActivos,
        string? search)
    {
        var result = await dispatcher.QueryAsync(new ObtenerPlantillasTrabajoQuery(productoId, soloActivos, search));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerPlantillaPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerPlantillaTrabajoPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearPlantilla(CrearPlantillaTrabajoRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new CrearPlantillaTrabajoCommand(request));
        return result.IsSuccess
            ? Results.Created($"/api/serviciocampo/plantillas-trabajo/{result.Value}", new { id = result.Value, message = "Plantilla de trabajo creada con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarPlantilla(Guid id, ActualizarPlantillaTrabajoRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new ActualizarPlantillaTrabajoCommand(id, request));
        return result.IsSuccess
            ? Results.Ok(new { message = "Plantilla de trabajo actualizada correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoPlantilla(Guid id, CambiarEstadoPlantillaRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new CambiarEstadoPlantillaTrabajoCommand(id, request.Activo));
        return result.IsSuccess
            ? Results.Ok(new { message = $"Plantilla {(request.Activo ? "activada" : "desactivada")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> EliminarPlantilla(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new EliminarPlantillaTrabajoCommand(id));
        return result.IsSuccess
            ? Results.Ok(new { message = "Plantilla de trabajo eliminada correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    // Handlers - Tareas
    private static async Task<IResult> ObtenerTareas(
        IDispatcher dispatcher,
        bool? soloActivas,
        string? search)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTareasQuery(soloActivas, search));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerTareaPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTareaPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearTarea(CrearTareaRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new CrearTareaCommand(request));
        return result.IsSuccess
            ? Results.Created($"/api/serviciocampo/tareas/{result.Value}", new { id = result.Value, message = "Tarea registrada con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarTarea(Guid id, ActualizarTareaRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new ActualizarTareaCommand(id, request));
        return result.IsSuccess
            ? Results.Ok(new { message = "Tarea actualizada correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> EliminarTarea(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new EliminarTareaCommand(id));
        return result.IsSuccess
            ? Results.Ok(new { message = "Tarea eliminada correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }
}
