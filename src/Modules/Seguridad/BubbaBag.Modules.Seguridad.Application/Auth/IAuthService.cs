using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Seguridad.Application.Auth;

public interface IAuthService
{
    Task<Result<string>> LoginAsync(string email, string password);
    Task<Result<bool>> ImportarUsuarioAsync(string email, string nombreCompleto, IEnumerable<string> roles, string modoDuplicados);
    Task<bool> RequiereConfiguracionAsync();
    Task<Result<Guid>> ConfigurarAdministradorAsync(string email, string password, string nombreCompleto);
    Task<Result<Guid>> RegisterAsync(string email, string password, string nombreCompleto, IEnumerable<string> roles);
    Task<Result<List<UsuarioDto>>> ObtenerUsuariosAsync(string? busqueda = null, bool? soloActivos = null);
    Task<Result<UsuarioDto>> ObtenerUsuarioPorIdAsync(Guid usuarioId);
    Task<Result<bool>> ActualizarUsuarioAsync(Guid usuarioId, string nombreCompleto, string email, IEnumerable<string>? roles = null);
    Task<Result<bool>> CambiarPasswordAsync(Guid usuarioId, string nuevaPassword);
    Task<Result<bool>> CambiarEstadoAsync(Guid usuarioId, bool esActivo);
    Task<Result<bool>> AsignarRolesAsync(Guid usuarioId, IEnumerable<string> roles);
    Task<Result<List<string>>> ObtenerRolesUsuarioAsync(Guid usuarioId);
    Task<Result<List<RolDto>>> ObtenerTodosLosRolesAsync();
    Task<Result<RolDto>> ObtenerRolPorIdAsync(Guid rolId);
    Task<Result<Guid>> CrearRolAsync(string nombreVisible, string? codigo, string modulo, string descripcion, IEnumerable<string> permisos);
    Task<Result<bool>> ActualizarRolAsync(Guid rolId, string nombreVisible, string modulo, string descripcion, IEnumerable<string> permisos);
    Task<Result<bool>> EliminarRolAsync(Guid rolId);
    Task<Result<List<PermisoDefinicionDto>>> ObtenerCatalogoPermisosAsync();
}
