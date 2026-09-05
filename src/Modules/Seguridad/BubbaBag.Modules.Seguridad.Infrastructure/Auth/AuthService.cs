using System;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Application.Auth;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using BubbaBag.SharedKernel;
using Microsoft.AspNetCore.Identity;

namespace BubbaBag.Modules.Seguridad.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<Usuario> _userManager;
    private readonly RoleManager<Rol> _roleManager;
    private readonly IJwtProvider _jwtProvider;

    public AuthService(UserManager<Usuario> userManager, RoleManager<Rol> roleManager, IJwtProvider jwtProvider)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtProvider = jwtProvider;
    }

    public async Task<Result<string>> LoginAsync(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null || !user.EsActivo)
        {
            return Result<string>.Failure("Credenciales inválidas o usuario inactivo.");
        }

        var isValidPassword = await _userManager.CheckPasswordAsync(user, password);
        if (!isValidPassword)
        {
            return Result<string>.Failure("Credenciales inválidas o usuario inactivo.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtProvider.GenerateToken(user, roles);

        return Result<string>.Success(token);
    }

    public async Task<Result<Guid>> RegisterAsync(string email, string password, string nombreCompleto, string rol)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return Result<Guid>.Failure("El correo ya está registrado.");
        }

        if (!await _roleManager.RoleExistsAsync(rol))
        {
            await _roleManager.CreateAsync(new Rol { Name = rol });
        }

        var user = new Usuario
        {
            UserName = email,
            Email = email,
            NombreCompleto = nombreCompleto
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            return Result<Guid>.Failure(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        await _userManager.AddToRoleAsync(user, rol);

        return Result<Guid>.Success(user.Id);
    }
}
