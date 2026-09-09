using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Application.Auth;
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

        group.MapPost("/login", IniciarSesion)
            .AllowAnonymous();

        group.MapGet("/roles", ObtenerRoles)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin, Roles.Gerencia));

        group.MapGet("/usuarios", ObtenerUsuarios)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin, Roles.Gerencia));

        group.MapGet("/usuarios/{id:guid}", ObtenerUsuarioPorId)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin, Roles.Gerencia));

        group.MapPost("/usuarios", RegistrarUsuario)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin));

        group.MapPut("/usuarios/{id:guid}", ActualizarUsuario)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin));

        group.MapPatch("/usuarios/{id:guid}/estado", CambiarEstadoUsuario)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin));

        group.MapPut("/usuarios/{id:guid}/password", CambiarPasswordUsuario)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin));

        group.MapGet("/usuarios/{id:guid}/roles", ObtenerRolesUsuario)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin));

        group.MapPut("/usuarios/{id:guid}/roles", AsignarRolesUsuario)
            .RequireAuthorization(p => p.RequireRole(Roles.SuperAdmin));
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
        var result = await authService.ActualizarUsuarioAsync(id, request.NombreCompleto, request.Email);
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
}

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string NombreCompleto, List<string> Roles);
public record AsignarRolesRequest(List<string> Roles);
