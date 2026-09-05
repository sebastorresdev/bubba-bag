using BubbaBag.Modules.Seguridad.Application.Auth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.Seguridad.Api;

public static class SeguridadEndpoints
{
    public static void MapSeguridadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/seguridad").WithTags("Seguridad");

        group.MapPost("/login", async (LoginRequest request, IAuthService authService) =>
        {
            var result = await authService.LoginAsync(request.Email, request.Password);
            if (result.IsFailure)
            {
                return Results.BadRequest(new { Error = result.Error });
            }
            return Results.Ok(new { Token = result.Value });
        })
        .AllowAnonymous();

        group.MapPost("/usuarios", async (RegisterRequest request, IAuthService authService) =>
        {
            var result = await authService.RegisterAsync(request.Email, request.Password, request.NombreCompleto, request.Rol);
            if (result.IsFailure)
            {
                return Results.BadRequest(new { Error = result.Error });
            }
            return Results.Ok(new { UsuarioId = result.Value });
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
    }
}

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string NombreCompleto, string Rol);
