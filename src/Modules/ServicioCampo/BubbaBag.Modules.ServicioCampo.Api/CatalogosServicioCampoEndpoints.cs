using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CrearMotivoIncidencia;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.ActualizarMotivoIncidencia;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CambiarEstadoMotivoIncidencia;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivosIncidencia;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivoIncidenciaPorId;

using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CrearTipoOrdenTrabajo;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.ActualizarTipoOrdenTrabajo;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CambiarEstadoTipoOrdenTrabajo;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTiposOrdenTrabajo;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTipoOrdenTrabajoPorId;

using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CrearTipoTareaServicio;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.ActualizarTipoTareaServicio;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CambiarEstadoTipoTareaServicio;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTiposTareaServicio;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTipoTareaServicioPorId;

using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.CrearTarifaServicio;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.ActualizarTarifaServicio;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.CambiarEstadoTarifaServicio;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Queries.ObtenerTarifasServicio;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Queries.ObtenerTarifaServicioPorId;
using System.Collections.Generic;
using System.Threading;

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
        // Mapear submódulos consolidados en Servicio de Campo
        app.MapClientesEndpoints();
        app.MapAlmacenesEndpoints();
        app.MapProductosEndpoints();

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
        // TIPOS DE ORDEN DE TRABAJO (Modalidad Operativa)
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
        // TIPOS DE TAREA DE SERVICIO (Catálogo de Prestaciones por Cliente)
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

        // =====================================================================
        // TARIFAS DE SERVICIO (DIRECTV, Claro, etc.)
        // =====================================================================
        var tarifasGroup = rootGroup.MapGroup("/tarifas-servicio");
        tarifasGroup.MapGet("/", ObtenerTarifasServicio)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        tarifasGroup.MapGet("/{id:guid}", ObtenerTarifaServicioPorId)
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        tarifasGroup.MapPost("/", CrearTarifaServicio)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        tarifasGroup.MapPut("/{id:guid}", ActualizarTarifaServicio)
            .RequireAuthorization(Permissions.ServicioCampo.CatalogosGestionar);
        tarifasGroup.MapPatch("/{id:guid}/estado", CambiarEstadoTarifaServicio)
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
        Guid? clienteFacturacionId,
        bool? soloActivos,
        string? search)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTiposTareaServicioQuery(clienteFacturacionId, soloActivos, search));
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
            request.ClienteFacturacionId,
            request.DuracionEstimadaMinutos);

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

    private static async Task<IResult> ObtenerTarifasServicio(
        IDispatcher dispatcher,
        string? empresaContratante,
        string? sucursal,
        bool? soloActivos,
        string? search,
        string? tipificacion)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTarifasServicioQuery(empresaContratante, sucursal, soloActivos, search, tipificacion));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerTarifaServicioPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTarifaServicioPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearTarifaServicio(CrearTarifaServicioCommand command, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/serviciocampo/catalogos/tarifas-servicio/{result.Value}", new { id = result.Value, message = "Tarifa de servicio registrada con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarTarifaServicio(Guid id, ActualizarTarifaServicioRequest request, IDispatcher dispatcher)
    {
        var command = new ActualizarTarifaServicioCommand(
            id,
            request.DetalleServicio,
            request.Tipificacion,
            request.TipoTareaServicioId,
            request.EmpresaContratante,
            request.ClienteFacturacionId,
            request.Sucursal,
            request.Puntos,
            request.FijoBase,
            request.FijoAdicional,
            request.VariableTotal,
            request.Indicador1_CycleTime,
            request.Indicador2_Agenda,
            request.Indicador3_Sin30,
            request.VariableAdicionalTotal,
            request.Indicador1_Adicional,
            request.Indicador2_Adicional,
            request.Indicador3_Adicional,
            request.MontoTotalTeorico,
            request.AplicaPago,
            request.AplicaGarantia);

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Tarifa de servicio actualizada correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoTarifaServicio(Guid id, CambiarEstadoCatalogoRequest request, IDispatcher dispatcher)
    {
        var command = new CambiarEstadoTarifaServicioCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Tarifa de servicio {(request.Activo ? "activada" : "desactivada")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }
}

// Request DTOs
public record CambiarEstadoCatalogoRequest(bool Activo);

public record ActualizarMotivoIncidenciaRequest(
    string Nombre,
    AmbitoMotivo Ambito,
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
    Guid? ClienteFacturacionId,
    int DuracionEstimadaMinutos);

public record ActualizarTarifaServicioRequest(
    string DetalleServicio,
    string Tipificacion = "GENERAL",
    Guid? TipoTareaServicioId = null,
    string EmpresaContratante = "DIRECTV",
    Guid? ClienteFacturacionId = null,
    string? Sucursal = null,
    int Puntos = 0,
    decimal FijoBase = 0,
    decimal FijoAdicional = 0,
    decimal VariableTotal = 0,
    decimal Indicador1_CycleTime = 0,
    decimal Indicador2_Agenda = 0,
    decimal Indicador3_Sin30 = 0,
    decimal VariableAdicionalTotal = 0,
    decimal Indicador1_Adicional = 0,
    decimal Indicador2_Adicional = 0,
    decimal Indicador3_Adicional = 0,
    decimal? MontoTotalTeorico = null,
    bool AplicaPago = true,
    bool AplicaGarantia = false);
