using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Seguridad.Application.Auth;

public interface IAuthService
{
    Task<Result<string>> LoginAsync(string email, string password);
    Task<Result<Guid>> RegisterAsync(string email, string password, string nombreCompleto, IEnumerable<string> roles);
    Task<Result<List<UsuarioDto>>> ObtenerUsuariosAsync(string? busqueda = null, bool? soloActivos = null);
    Task<Result<UsuarioDto>> ObtenerUsuarioPorIdAsync(Guid usuarioId);
    Task<Result<bool>> ActualizarUsuarioAsync(Guid usuarioId, string nombreCompleto, string email);
    Task<Result<bool>> CambiarPasswordAsync(Guid usuarioId, string nuevaPassword);
    Task<Result<bool>> CambiarEstadoAsync(Guid usuarioId, bool esActivo);
    Task<Result<bool>> AsignarRolesAsync(Guid usuarioId, IEnumerable<string> roles);
    Task<Result<List<string>>> ObtenerRolesUsuarioAsync(Guid usuarioId);
    Task<Result<List<RolDto>>> ObtenerTodosLosRolesAsync();
}
