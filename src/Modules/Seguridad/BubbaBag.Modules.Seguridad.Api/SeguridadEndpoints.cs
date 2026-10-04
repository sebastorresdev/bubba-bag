using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Application.Auth;
using BubbaBag.Modules.Seguridad.Application.Vistas;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.Seguridad.Api;

public static class SeguridadEndpoints
{
    public static void MapSeguridadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/seguridad").WithTags("Seguridad");

        group.MapGet("/configuracion-inicial", ObtenerEstadoConfiguracion).AllowAnonymous();
        group.MapPost("/configuracion-inicial", ConfigurarAdministrador).AllowAnonymous();
        group.MapGet("/sesion", ObtenerSesion).RequireAuthorization();

        group.MapPost("/login", IniciarSesion)
            .AllowAnonymous();

        group.MapGet("/roles", ObtenerRoles)
            .RequireAuthorization(Permissions.Seguridad.Acceso);

        group.MapGet("/usuarios", ObtenerUsuarios)
            .RequireAuthorization(Permissions.Seguridad.Acceso);

        group.MapGet("/usuarios/{id:guid}", ObtenerUsuarioPorId)
            .RequireAuthorization(Permissions.Seguridad.Acceso);

        group.MapPost("/usuarios", RegistrarUsuario)
            .RequireAuthorization(Permissions.Seguridad.UsuariosGestionar);

        group.MapPut("/usuarios/{id:guid}", ActualizarUsuario)
            .RequireAuthorization(Permissions.Seguridad.UsuariosGestionar);

        group.MapPatch("/usuarios/{id:guid}/estado", CambiarEstadoUsuario)
            .RequireAuthorization(Permissions.Seguridad.UsuariosGestionar);

        group.MapPut("/usuarios/{id:guid}/password", CambiarPasswordUsuario)
            .RequireAuthorization(Permissions.Seguridad.UsuariosGestionar);

        group.MapGet("/usuarios/{id:guid}/roles", ObtenerRolesUsuario)
            .RequireAuthorization(Permissions.Seguridad.UsuariosGestionar);

        group.MapPut("/usuarios/{id:guid}/roles", AsignarRolesUsuario)
            .RequireAuthorization(Permissions.Seguridad.UsuariosGestionar);

        // Vistas Personalizadas y Predeterminadas (Dynamics 365)
        group.MapGet("/vistas", ObtenerVistasPorEntidad)
            .RequireAuthorization();

        group.MapPost("/vistas", GuardarVista)
            .RequireAuthorization();

        group.MapPut("/vistas/predeterminada", EstablecerVistaPredeterminada)
            .RequireAuthorization();

        group.MapDelete("/vistas/{id:guid}", EliminarVista)
            .RequireAuthorization();
    }

    private static async Task<IResult> ObtenerEstadoConfiguracion(IAuthService authService)
        => Results.Ok(new { RequiereConfiguracion = await authService.RequiereConfiguracionAsync() });

    private static async Task<IResult> ConfigurarAdministrador(ConfiguracionInicialRequest request, IAuthService authService)
    {
        var resultado = await authService.ConfigurarAdministradorAsync(request.Email, request.Password, request.NombreCompleto);
        return resultado.IsSuccess ? Results.Ok(new { UsuarioId = resultado.Value })
            : Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Configuración inicial", resultado.Error));
    }

    private static async Task<IResult> ObtenerSesion(IAuthService authService, ICurrentUser usuario)
    {
        var resultado = await authService.ObtenerUsuarioPorIdAsync(usuario.Id);
        return resultado.IsSuccess ? Results.Ok(new { Usuario = resultado.Value, Permisos = RolePermissions.GetPermissionsForRoles(resultado.Value.Roles) })
            : Results.Unauthorized();
    }

    private static async Task<IResult> IniciarSesion(LoginRequest request, IAuthService authService)
    {
        var result = await authService.LoginAsync(request.Email, request.Password);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error de autenticación", result.Error));
        }
        return Results.Ok(new { Token = result.Value });
    }

    private static async Task<IResult> ObtenerRoles(IAuthService authService)
    {
        var result = await authService.ObtenerTodosLosRolesAsync();
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerUsuarios(string? busqueda, bool? soloActivos, IAuthService authService)
    {
        var result = await authService.ObtenerUsuariosAsync(busqueda, soloActivos);
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerUsuarioPorId(Guid id, IAuthService authService)
    {
        var result = await authService.ObtenerUsuarioPorIdAsync(id);
        if (result.IsFailure)
        {
            return Results.NotFound(new BubbaBag.SharedKernel.Http.ErrorResponse(404, "Usuario no encontrado", result.Error));
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> RegistrarUsuario(RegisterRequest request, IAuthService authService)
    {
        var result = await authService.RegisterAsync(request.Email, request.Password, request.NombreCompleto, request.Roles);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de registro", result.Error));
        }
        return Results.Ok(new { UsuarioId = result.Value });
    }

    private static async Task<IResult> ActualizarUsuario(Guid id, ActualizarUsuarioRequest request, IAuthService authService)
    {
        var result = await authService.ActualizarUsuarioAsync(id, request.NombreCompleto, request.Email, request.Roles);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al actualizar usuario", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> CambiarEstadoUsuario(Guid id, CambiarEstadoUsuarioRequest request, IAuthService authService)
    {
        var result = await authService.CambiarEstadoAsync(id, request.EsActivo);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al cambiar estado", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> CambiarPasswordUsuario(Guid id, CambiarPasswordRequest request, IAuthService authService)
    {
        var result = await authService.CambiarPasswordAsync(id, request.NuevaPassword);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al restablecer contraseña", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> ObtenerRolesUsuario(Guid id, IAuthService authService)
    {
        var result = await authService.ObtenerRolesUsuarioAsync(id);
        if (result.IsFailure)
        {
            return Results.NotFound(new BubbaBag.SharedKernel.Http.ErrorResponse(404, "Usuario no encontrado", result.Error));
        }
        return Results.Ok(new { Roles = result.Value });
    }

    private static async Task<IResult> AsignarRolesUsuario(Guid id, AsignarRolesRequest request, IAuthService authService)
    {
        var result = await authService.AsignarRolesAsync(id, request.Roles);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al asignar roles", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> ObtenerVistasPorEntidad(string entidad, IVistasService vistasService, ICurrentUser currentUser)
    {
        var result = await vistasService.ObtenerVistasPorEntidadAsync(currentUser.Id, entidad);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al obtener vistas", result.Error));
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> GuardarVista(GuardarVistaRequest request, IVistasService vistasService, ICurrentUser currentUser)
    {
        var result = await vistasService.GuardarVistaAsync(currentUser.Id, request);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al guardar vista", result.Error));
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> EstablecerVistaPredeterminada(EstablecerPredeterminadaRequest request, IVistasService vistasService, ICurrentUser currentUser)
    {
        var result = await vistasService.EstablecerPredeterminadaAsync(currentUser.Id, request.Entidad, request.VistaId, request.VistaKey);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al establecer vista predeterminada", result.Error));
        }
        return Results.Ok(new { Success = true });
    }

    private static async Task<IResult> EliminarVista(Guid id, IVistasService vistasService, ICurrentUser currentUser)
    {
        var result = await vistasService.EliminarVistaAsync(currentUser.Id, id);
        if (result.IsFailure)
        {
            return Results.BadRequest(new BubbaBag.SharedKernel.Http.ErrorResponse(400, "Error al eliminar vista", result.Error));
        }
        return Results.Ok(new { Success = true });
    }
}

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string NombreCompleto, List<string> Roles);
public record AsignarRolesRequest(List<string> Roles);
public record ConfiguracionInicialRequest(string Email, string Password, string NombreCompleto);
