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
                return Result<Guid>.Failure($"El rol '{rol}' no existe en el sistema.");
            }
        }

        var user = new Usuario
        {
            UserName = email.Trim(),
            Email = email.Trim(),
            NombreCompleto = nombreCompleto.Trim(),
            EsActivo = true
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

    public async Task<Result<List<UsuarioDto>>> ObtenerUsuariosAsync(string? busqueda = null, bool? soloActivos = null)
    {
        var query = _userManager.Users.AsNoTracking();

        if (soloActivos.HasValue)
        {
            query = query.Where(u => u.EsActivo == soloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var term = busqueda.Trim().ToLower();
            query = query.Where(u => u.NombreCompleto.ToLower().Contains(term) || (u.Email != null && u.Email.ToLower().Contains(term)));
        }

        var users = await query.OrderBy(u => u.NombreCompleto).ToListAsync();
        var lista = new List<UsuarioDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            lista.Add(new UsuarioDto(
                user.Id,
                user.Email ?? string.Empty,
                user.NombreCompleto,
                user.EsActivo,
                roles.ToList()
            ));
        }

        return Result<List<UsuarioDto>>.Success(lista);
    }

    public async Task<Result<UsuarioDto>> ObtenerUsuarioPorIdAsync(Guid usuarioId)
    {
        var user = await _userManager.FindByIdAsync(usuarioId.ToString());
        if (user == null)
        {
            return Result<UsuarioDto>.Failure("Usuario no encontrado.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var dto = new UsuarioDto(
            user.Id,
            user.Email ?? string.Empty,
            user.NombreCompleto,
            user.EsActivo,
            roles.ToList()
        );

        return Result<UsuarioDto>.Success(dto);
    }

    public async Task<Result<bool>> ActualizarUsuarioAsync(Guid usuarioId, string nombreCompleto, string email)
    {
        var user = await _userManager.FindByIdAsync(usuarioId.ToString());
        if (user == null)
        {
            return Result<bool>.Failure("Usuario no encontrado.");
        }

        var emailLimpio = email.Trim();
        if (!string.Equals(user.Email, emailLimpio, StringComparison.OrdinalIgnoreCase))
        {
            var emailOcupado = await _userManager.FindByEmailAsync(emailLimpio);
            if (emailOcupado != null && emailOcupado.Id != user.Id)
            {
                return Result<bool>.Failure("El correo ya está en uso por otro usuario.");
            }
            user.Email = emailLimpio;
            user.UserName = emailLimpio;
        }

        user.NombreCompleto = nombreCompleto.Trim();

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return Result<bool>.Failure(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> CambiarPasswordAsync(Guid usuarioId, string nuevaPassword)
    {
        var user = await _userManager.FindByIdAsync(usuarioId.ToString());
        if (user == null)
        {
            return Result<bool>.Failure("Usuario no encontrado.");
        }

        if (string.IsNullOrWhiteSpace(nuevaPassword) || nuevaPassword.Length < 6)
        {
            return Result<bool>.Failure("La contraseña debe tener al menos 6 caracteres.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, nuevaPassword);
        if (!result.Succeeded)
        {
            return Result<bool>.Failure(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> CambiarEstadoAsync(Guid usuarioId, bool esActivo)
    {
        var user = await _userManager.FindByIdAsync(usuarioId.ToString());
        if (user == null)
        {
            return Result<bool>.Failure("Usuario no encontrado.");
        }

        if (!esActivo && string.Equals(user.Email, "admin@bubbabag.com", StringComparison.OrdinalIgnoreCase))
        {
            return Result<bool>.Failure("No se puede desactivar el usuario SuperAdmin principal del sistema.");
        }

        user.EsActivo = esActivo;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return Result<bool>.Failure(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return Result<bool>.Success(true);
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
                return Result<bool>.Failure($"El rol '{rol}' no existe en el sistema.");
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
            .OrderBy(r => r.Modulo)
            .ThenBy(r => r.Name)
            .Select(r => new RolDto(
                r.Id,
                r.Name!,
                r.Modulo,
                r.NombreVisible,
                r.Descripcion))
            .ToListAsync();
        return Result<List<RolDto>>.Success(roles);
    }
}
