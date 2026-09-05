using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Application.Auth;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using BubbaBag.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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

    public async Task<Result<Guid>> RegisterAsync(string email, string password, string nombreCompleto, IEnumerable<string> roles)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return Result<Guid>.Failure("El correo ya está registrado.");
        }

        var rolesList = roles?.ToList() ?? new List<string>();
        foreach (var rol in rolesList)
        {
            if (!await _roleManager.RoleExistsAsync(rol))
            {
                await _roleManager.CreateAsync(new Rol { Name = rol });
            }
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

        if (rolesList.Count > 0)
        {
            await _userManager.AddToRolesAsync(user, rolesList);
        }

        return Result<Guid>.Success(user.Id);
    }

    public async Task<Result<bool>> AsignarRolesAsync(Guid usuarioId, IEnumerable<string> roles)
    {
        var user = await _userManager.FindByIdAsync(usuarioId.ToString());
        if (user == null)
        {
            return Result<bool>.Failure("Usuario no encontrado.");
        }

        var rolesList = roles?.ToList() ?? new List<string>();
        foreach (var rol in rolesList)
        {
            if (!await _roleManager.RoleExistsAsync(rol))
            {
                await _roleManager.CreateAsync(new Rol { Name = rol });
            }
        }

        var rolesActuales = await _userManager.GetRolesAsync(user);
        var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesActuales);
        if (!removeResult.Succeeded)
        {
            return Result<bool>.Failure("Error al remover roles anteriores.");
        }

        if (rolesList.Count > 0)
        {
            var addResult = await _userManager.AddToRolesAsync(user, rolesList);
            if (!addResult.Succeeded)
            {
                return Result<bool>.Failure("Error al asignar los nuevos roles.");
            }
        }

        return Result<bool>.Success(true);
    }

    public async Task<Result<List<string>>> ObtenerRolesUsuarioAsync(Guid usuarioId)
    {
        var user = await _userManager.FindByIdAsync(usuarioId.ToString());
        if (user == null)
        {
            return Result<List<string>>.Failure("Usuario no encontrado.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Result<List<string>>.Success(roles.ToList());
    }

    public async Task<Result<List<RolDto>>> ObtenerTodosLosRolesAsync()
    {
        var roles = await _roleManager.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RolDto(r.Id, r.Name!, r.Descripcion))
            .ToListAsync();
        return Result<List<RolDto>>.Success(roles);
    }
}
