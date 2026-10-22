using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Clientes;
using BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.ActualizarCliente;
using BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.CambiarEstadoCliente;
using BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.CrearCliente;
using BubbaBag.Modules.ServicioCampo.Application.Clientes.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.Clientes.Queries.ObtenerClientePorId;
using BubbaBag.Modules.ServicioCampo.Application.Clientes.Queries.ObtenerClientes;
using BubbaBag.Modules.ServicioCampo.Application.Ubigeos.Queries.ObtenerUbigeos;
using BubbaBag.SharedKernel.Authorization;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class ClientesEndpoints
{
    public static void MapClientesEndpoints(this IEndpointRouteBuilder app)
    {
        var clientesGroup = app.MapGroup("/api/crm/clientes")
            .WithTags("Servicio de Campo - Cuentas")
            .RequireAuthorization();

        clientesGroup.MapGet("/", ObtenerClientes);
        clientesGroup.MapGet("/{id:guid}", ObtenerClientePorId);
        clientesGroup.MapPost("/", CrearCliente)
            .RequireAuthorization(Permissions.Crm.ClientesCrear);
        clientesGroup.MapPut("/{id:guid}", ActualizarCliente)
            .RequireAuthorization(Permissions.Crm.ClientesEditar);
        clientesGroup.MapPatch("/{id:guid}/estado", CambiarEstadoCliente)
            .RequireAuthorization(Permissions.Crm.ClientesEditar);

        var contactosGroup = app.MapGroup("/api/crm/contactos")
            .WithTags("Servicio de Campo - Contactos")
            .RequireAuthorization();

        contactosGroup.MapGet("/", ObtenerContactos);
        contactosGroup.MapGet("/{id:guid}", ObtenerContactoPorId);
        contactosGroup.MapPost("/", CrearContacto)
            .RequireAuthorization(Permissions.Crm.ClientesCrear);
        contactosGroup.MapPut("/{id:guid}", ActualizarContacto)
            .RequireAuthorization(Permissions.Crm.ClientesEditar);
        contactosGroup.MapPatch("/{id:guid}/estado", CambiarEstadoContacto)
            .RequireAuthorization(Permissions.Crm.ClientesEditar);
        contactosGroup.MapDelete("/{id:guid}", EliminarContacto)
            .RequireAuthorization(Permissions.Crm.ClientesEditar);

        var ubigeosGroup = app.MapGroup("/api/crm/ubigeos")
            .WithTags("Servicio de Campo - Ubigeos")
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
            ? Results.Created($"/api/crm/clientes/{result.Value}", new { id = result.Value, message = "Cuenta registrada con éxito." })
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
            CoordenadaLng: request.CoordenadaLng,
            EsClienteFacturacion: request.EsClienteFacturacion,
            EsClienteServicio: request.EsClienteServicio,
            Nombres: request.Nombres,
            DocumentoIdentidad: request.DocumentoIdentidad,
            TelefonoSecundario: request.TelefonoSecundario,
            Email: request.Email,
            ContactoPrincipalId: request.ContactoPrincipalId
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = "Cuenta actualizada correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoCliente(Guid id, CambiarEstadoClienteRequest request, IDispatcher dispatcher)
    {
        var command = new CambiarEstadoClienteCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { message = $"Cuenta {(request.Activo ? "activada" : "desactivada")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    // Handlers de Contactos
    private static async Task<IResult> ObtenerContactos(
        IDispatcher dispatcher,
        string? search,
        Guid? cuentaId,
        bool? soloActivos)
    {
        var result = await dispatcher.QueryAsync(new ObtenerContactosQuery(search, cuentaId, soloActivos));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerContactoPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerContactoPorIdQuery(id));
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { message = result.Error });
    }

    private static async Task<IResult> CrearContacto(CrearContactoRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new CrearContactoCommand(request));
        return result.IsSuccess
            ? Results.Created($"/api/crm/contactos/{result.Value}", new { id = result.Value, message = "Contacto registrado con éxito." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> ActualizarContacto(Guid id, ActualizarContactoRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new ActualizarContactoCommand(id, request));
        return result.IsSuccess
            ? Results.Ok(new { message = "Contacto actualizado correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> CambiarEstadoContacto(Guid id, CambiarEstadoClienteRequest request, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new CambiarEstadoContactoCommand(id, request.Activo));
        return result.IsSuccess
            ? Results.Ok(new { message = $"Contacto {(request.Activo ? "activado" : "desactivado")} correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }

    private static async Task<IResult> EliminarContacto(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.SendAsync(new EliminarContactoCommand(id));
        return result.IsSuccess
            ? Results.Ok(new { message = "Contacto eliminado correctamente." })
            : Results.BadRequest(new { message = result.Error });
    }
}

public record ActualizarClienteRequest(
    string TelefonoPrincipal,
    string Direccion,
    string UbigeoCodigo,
    string? ReferenciaUbicacion = null,
    decimal? CoordenadaLat = null,
    decimal? CoordenadaLng = null,
    bool? EsClienteFacturacion = null,
    bool? EsClienteServicio = null,
    string? Nombres = null,
    string? DocumentoIdentidad = null,
    string? TelefonoSecundario = null,
    string? Email = null,
    Guid? ContactoPrincipalId = null);

public record CambiarEstadoClienteRequest(bool Activo);
