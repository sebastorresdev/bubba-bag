using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Features;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.OrigenesOrden.Features;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Features;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Features;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.SharedKernel.Authorization;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class CatalogosServicioCampoEndpoints
{
    public static void MapServicioCampoEndpoints(this IEndpointRouteBuilder app)
    {
        var rootGroup = app.MapGroup("/api/serviciocampo/catalogos")
            .WithTags("Servicio de Campo - Catálogos")
            .RequireAuthorization();

        // =====================================================================
        // MOTIVOS DE INCIDENCIA
        // =====================================================================
        var motivosGroup = rootGroup.MapGroup("/motivos-incidencia");
        motivosGroup.MapGet("/", ObtenerMotivosIncidencia)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        motivosGroup.MapGet("/{id:guid}", ObtenerMotivoIncidenciaPorId)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        motivosGroup.MapPost("/", CrearMotivoIncidencia)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        motivosGroup.MapPut("/{id:guid}", ActualizarMotivoIncidencia)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        motivosGroup.MapPatch("/{id:guid}/estado", CambiarEstadoMotivoIncidencia)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        // =====================================================================
        // ORÍGENES DE ORDEN
        // =====================================================================
        var origenesGroup = rootGroup.MapGroup("/origenes-orden");
        origenesGroup.MapGet("/", ObtenerOrigenesOrden)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        origenesGroup.MapGet("/{id:guid}", ObtenerOrigenOrdenPorId)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        origenesGroup.MapPost("/", CrearOrigenOrden)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        origenesGroup.MapPut("/{id:guid}", ActualizarOrigenOrden)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        origenesGroup.MapPatch("/{id:guid}/estado", CambiarEstadoOrigenOrden)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        // =====================================================================
        // TIPOS DE ORDEN DE TRABAJO
        // =====================================================================
        var tiposOrdenGroup = rootGroup.MapGroup("/tipos-orden");
        tiposOrdenGroup.MapGet("/", ObtenerTiposOrden)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        tiposOrdenGroup.MapGet("/{id:guid}", ObtenerTipoOrdenPorId)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        tiposOrdenGroup.MapPost("/", CrearTipoOrden)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        tiposOrdenGroup.MapPut("/{id:guid}", ActualizarTipoOrden)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        tiposOrdenGroup.MapPatch("/{id:guid}/estado", CambiarEstadoTipoOrden)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);

        // =====================================================================
        // TIPOS DE TAREA DE SERVICIO
        // =====================================================================
        var tiposTareaGroup = rootGroup.MapGroup("/tipos-tarea");
        tiposTareaGroup.MapGet("/", ObtenerTiposTarea)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        tiposTareaGroup.MapGet("/{id:guid}", ObtenerTipoTareaPorId)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        tiposTareaGroup.MapPost("/", CrearTipoTarea)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        tiposTareaGroup.MapPut("/{id:guid}", ActualizarTipoTarea)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        tiposTareaGroup.MapPatch("/{id:guid}/estado", CambiarEstadoTipoTarea)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
    }

    // Handlers - Motivos de Incidencia
    private static async Task<IResult> ObtenerMotivosIncidencia(
        IDispatcher dispatcher,
        AmbitoMotivo? ambito,
        bool? soloActivos,
        string? search)
    {
        var result = await dispatcher.QueryAsync(new ObtenerMotivosIncidenciaQuery(ambito, soloActivos, search));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerMotivoIncidenciaPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerMotivoIncidenciaPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearMotivoIncidencia(CrearMotivoIncidenciaCommand command, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/serviciocampo/catalogos/motivos-incidencia/{result.Value}", new { id = result.Value, message = "Motivo de incidencia registrado con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarMotivoIncidencia(Guid id, ActualizarMotivoIncidenciaRequest request, IDispatcher dispatcher)
    {
        var command = new ActualizarMotivoIncidenciaCommand(id, request.Nombre, request.Ambito, request.Descripcion);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Motivo de incidencia actualizado correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoMotivoIncidencia(Guid id, CambiarEstadoCatalogoRequest request, IDispatcher dispatcher)
    {
        var command = new CambiarEstadoMotivoIncidenciaCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Motivo de incidencia {(request.Activo ? "activado" : "desactivado")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    // Handlers - Orígenes de Orden
    private static async Task<IResult> ObtenerOrigenesOrden(
        IDispatcher dispatcher,
        bool? soloActivos,
        string? search)
    {
        var result = await dispatcher.QueryAsync(new ObtenerOrigenesOrdenQuery(soloActivos, search));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerOrigenOrdenPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerOrigenOrdenPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearOrigenOrden(CrearOrigenOrdenCommand command, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/serviciocampo/catalogos/origenes-orden/{result.Value}", new { id = result.Value, message = "Origen de orden registrado con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarOrigenOrden(Guid id, ActualizarOrigenOrdenRequest request, IDispatcher dispatcher)
    {
        var command = new ActualizarOrigenOrdenCommand(id, request.Nombre, request.EsIntegracionExterna, request.Descripcion);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Origen de orden actualizado correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoOrigenOrden(Guid id, CambiarEstadoCatalogoRequest request, IDispatcher dispatcher)
    {
        var command = new CambiarEstadoOrigenOrdenCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Origen de orden {(request.Activo ? "activado" : "desactivado")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    // Handlers - Tipos de Orden
    private static async Task<IResult> ObtenerTiposOrden(
        IDispatcher dispatcher,
        bool? soloActivos,
        string? search)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTiposOrdenTrabajoQuery(soloActivos, search));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerTipoOrdenPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTipoOrdenTrabajoPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearTipoOrden(CrearTipoOrdenTrabajoCommand command, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/serviciocampo/catalogos/tipos-orden/{result.Value}", new { id = result.Value, message = "Tipo de orden de trabajo registrado con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarTipoOrden(Guid id, ActualizarTipoOrdenTrabajoRequest request, IDispatcher dispatcher)
    {
        var command = new ActualizarTipoOrdenTrabajoCommand(
            id,
            request.Nombre,
            request.RequiereVisitaCampo,
            request.ExigeFirmaCliente,
            request.ExigeEvidenciasFotograficas,
            request.Descripcion,
            request.ColorHex);

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Tipo de orden de trabajo actualizado correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoTipoOrden(Guid id, CambiarEstadoCatalogoRequest request, IDispatcher dispatcher)
    {
        var command = new CambiarEstadoTipoOrdenTrabajoCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Tipo de orden {(request.Activo ? "activado" : "desactivado")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    // Handlers - Tipos de Tarea
    private static async Task<IResult> ObtenerTiposTarea(
        IDispatcher dispatcher,
        string? categoria,
        bool? soloActivos,
        string? search)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTiposTareaServicioQuery(categoria, soloActivos, search));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerTipoTareaPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTipoTareaServicioPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearTipoTarea(CrearTipoTareaServicioCommand command, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/serviciocampo/catalogos/tipos-tarea/{result.Value}", new { id = result.Value, message = "Tipo de tarea de servicio registrado con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarTipoTarea(Guid id, ActualizarTipoTareaServicioRequest request, IDispatcher dispatcher)
    {
        var command = new ActualizarTipoTareaServicioCommand(
            id,
            request.Nombre,
            request.Categoria,
            request.DuracionEstimadaMinutos,
            request.EsTareaSiebel);

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Tipo de tarea de servicio actualizado correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoTipoTarea(Guid id, CambiarEstadoCatalogoRequest request, IDispatcher dispatcher)
    {
        var command = new CambiarEstadoTipoTareaServicioCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Tipo de tarea {(request.Activo ? "activado" : "desactivado")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }
}

// Request DTOs
public record CambiarEstadoCatalogoRequest(bool Activo);

public record ActualizarMotivoIncidenciaRequest(
    string Nombre,
    AmbitoMotivo Ambito,
    string? Descripcion = null);

public record ActualizarOrigenOrdenRequest(
    string Nombre,
    bool EsIntegracionExterna,
    string? Descripcion = null);

public record ActualizarTipoOrdenTrabajoRequest(
    string Nombre,
    bool RequiereVisitaCampo,
    bool ExigeFirmaCliente,
    bool ExigeEvidenciasFotograficas,
    string? Descripcion = null,
    string ColorHex = "#0f6cbd");

public record ActualizarTipoTareaServicioRequest(
    string Nombre,
    string Categoria,
    int DuracionEstimadaMinutos,
    bool EsTareaSiebel);
