using System.ComponentModel.DataAnnotations;
using BubbaBag.Modules.Seguridad.Application.Auth;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Seguridad.Infrastructure.Auth;

public class AuthService(UserManager<Usuario> usuarios, RoleManager<Rol> roles, IJwtProvider jwt, SeguridadDbContext db) : IAuthService
{
    private static string Errores(IdentityResult resultado) => string.Join(", ", resultado.Errors.Select(x => x.Description));
    private static bool DatosValidos(string email, string nombre) => !string.IsNullOrWhiteSpace(nombre) && nombre.Trim().Length <= 150
        && !string.IsNullOrWhiteSpace(email) && email.Length <= 256 && new EmailAddressAttribute().IsValid(email.Trim());

    // Bloqueo compartido entre instancias: configuración inicial y último administrador.
    // Los datos y roles de una edición se confirman o revierten juntos.
    private async Task<Result<T>> EscribirAsync<T>(Func<Task<Result<T>>> accion)
    {
        if (!db.Database.IsRelational() || db.Database.CurrentTransaction != null) return await accion();
        var estrategia = db.Database.CreateExecutionStrategy();
        return await estrategia.ExecuteAsync(async () =>
        {
            // Identity usa este mismo contexto: cada intento debe releer las entidades,
            // sin conservar inserciones ni cambios de un intento revertido.
            db.ChangeTracker.Clear();
            await using var transaccion = await db.Database.BeginTransactionAsync();
            try
            {
                if (db.Database.IsNpgsql()) await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(761004301)");
                var resultado = await accion();
                if (resultado.IsSuccess) await transaccion.CommitAsync();
                else { await transaccion.RollbackAsync(); db.ChangeTracker.Clear(); }
                return resultado;
            }
            catch
            {
                db.ChangeTracker.Clear();
                throw;
            }
        });
    }
    public async Task<bool> RequiereConfiguracionAsync() => !await db.Users.AnyAsync();
    public Task<Result<Guid>> ConfigurarAdministradorAsync(string email, string password, string nombreCompleto) => EscribirAsync(async () =>
    {
        if (await db.Users.AnyAsync()) return Result<Guid>.Failure("La configuración inicial ya está completada. Inicie sesión con una cuenta existente.");
        return await RegistrarAsync(email, password, nombreCompleto, [Roles.SuperAdmin]);
    });
    public async Task<Result<string>> LoginAsync(string email, string password)
    {
        const string error = "Credenciales inválidas, usuario inactivo o acceso bloqueado temporalmente.";
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password)) return Result<string>.Failure(error);
        var usuario = await usuarios.FindByEmailAsync(email.Trim());
        if (usuario == null || !usuario.EsActivo || await usuarios.IsLockedOutAsync(usuario)) return Result<string>.Failure(error);
        if (!await usuarios.CheckPasswordAsync(usuario, password))
        {
            await usuarios.AccessFailedAsync(usuario);
            return Result<string>.Failure(error);
        }
        await usuarios.ResetAccessFailedCountAsync(usuario);
        return Result<string>.Success(jwt.GenerateToken(usuario, await usuarios.GetRolesAsync(usuario)));
    }
    public Task<Result<Guid>> RegisterAsync(string email, string password, string nombreCompleto, IEnumerable<string> rolesUsuario)
        => EscribirAsync(() => RegistrarAsync(email, password, nombreCompleto, rolesUsuario));
    private async Task<Result<Guid>> RegistrarAsync(string email, string? password, string nombreCompleto, IEnumerable<string> rolesUsuario, bool activo = true)
    {
        if (!DatosValidos(email, nombreCompleto)) return Result<Guid>.Failure("Ingrese un nombre y correo válidos.");
        if (activo && string.IsNullOrWhiteSpace(password)) return Result<Guid>.Failure("Ingrese una contraseña.");
        if (await usuarios.FindByEmailAsync(email.Trim()) != null) return Result<Guid>.Failure("El correo ya está registrado.");
        var elegidos = (rolesUsuario ?? []).Distinct(StringComparer.Ordinal).ToArray();
        if (!await RolesValidosAsync(elegidos)) return Result<Guid>.Failure("Seleccione roles válidos del catálogo del sistema.");
        var usuario = new Usuario { UserName = email.Trim(), Email = email.Trim(), NombreCompleto = nombreCompleto.Trim(), EsActivo = activo, LockoutEnabled = true };
        var resultado = activo ? await usuarios.CreateAsync(usuario, password!) : await usuarios.CreateAsync(usuario);
        if (!resultado.Succeeded) return Result<Guid>.Failure(Errores(resultado));
        resultado = await usuarios.AddToRolesAsync(usuario, elegidos);
        if (!resultado.Succeeded) return Result<Guid>.Failure(Errores(resultado));
        return Result<Guid>.Success(usuario.Id);
    }
    public Task<Result<bool>> ImportarUsuarioAsync(string email, string nombreCompleto, IEnumerable<string> rolesUsuario, string modoDuplicados) => EscribirAsync(async () =>
    {
        if (!DatosValidos(email, nombreCompleto)) return Result<bool>.Failure("Ingrese un nombre y correo válidos.");
        if (!await RolesValidosAsync(rolesUsuario)) return Result<bool>.Failure("Seleccione roles válidos del catálogo.");
        var existente = await usuarios.FindByEmailAsync(email.Trim());
        if (existente != null)
        {
            if (modoDuplicados.Equals("Skip", StringComparison.OrdinalIgnoreCase)) return Result<bool>.Success(false);
            if (!modoDuplicados.Equals("Update", StringComparison.OrdinalIgnoreCase)) return Result<bool>.Failure("El correo ya está registrado.");
            return await ActualizarUsuarioAsync(existente.Id, nombreCompleto, email, rolesUsuario);
        }
        var resultado = await RegistrarAsync(email, null, nombreCompleto, rolesUsuario, activo: false);
        return resultado.IsSuccess ? Result<bool>.Success(true) : Result<bool>.Failure(resultado.Error);
    });

    private async Task<bool> RolesValidosAsync(IEnumerable<string> elegidos)
    {
        foreach (var rol in elegidos)
            if (!Roles.Fijos.Contains(rol) || !await roles.RoleExistsAsync(rol)) return false;
        return true;
    }
    private async Task<bool> EsUltimoAdministradorAsync(Usuario usuario)
    {
        if (!usuario.EsActivo || !await usuarios.IsInRoleAsync(usuario, Roles.SuperAdmin)) return false;
        return !(await usuarios.GetUsersInRoleAsync(Roles.SuperAdmin)).Any(x => x.Id != usuario.Id && x.EsActivo);
    }
    private async Task<UsuarioDto> DtoAsync(Usuario usuario) => new(usuario.Id, usuario.Email ?? "", usuario.NombreCompleto, usuario.EsActivo, (await usuarios.GetRolesAsync(usuario)).ToList());
    public async Task<Result<List<UsuarioDto>>> ObtenerUsuariosAsync(string? busqueda = null, bool? soloActivos = null)
    {
        var consulta = usuarios.Users.AsNoTracking();
        if (soloActivos.HasValue) consulta = consulta.Where(x => x.EsActivo == soloActivos.Value);
        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var termino = busqueda.Trim().ToLower();
            consulta = consulta.Where(x => x.NombreCompleto.ToLower().Contains(termino) || (x.Email != null && x.Email.ToLower().Contains(termino)));
        }
        var lista = new List<UsuarioDto>();
        foreach (var usuario in await consulta.OrderBy(x => x.NombreCompleto).ToListAsync()) lista.Add(await DtoAsync(usuario));
        return Result<List<UsuarioDto>>.Success(lista);
    }
    public async Task<Result<UsuarioDto>> ObtenerUsuarioPorIdAsync(Guid usuarioId)
    {
        var usuario = await usuarios.FindByIdAsync(usuarioId.ToString());
        return usuario == null ? Result<UsuarioDto>.Failure("Usuario no encontrado.") : Result<UsuarioDto>.Success(await DtoAsync(usuario));
    }
    public Task<Result<bool>> ActualizarUsuarioAsync(Guid usuarioId, string nombreCompleto, string email, IEnumerable<string>? rolesUsuario = null) => EscribirAsync(async () =>
    {
        var usuario = await usuarios.FindByIdAsync(usuarioId.ToString());
        if (usuario == null) return Result<bool>.Failure("Usuario no encontrado.");
        if (!DatosValidos(email, nombreCompleto)) return Result<bool>.Failure("Ingrese un nombre y correo válidos.");
        var ocupado = await usuarios.FindByEmailAsync(email.Trim());
        if (ocupado != null && ocupado.Id != usuario.Id) return Result<bool>.Failure("El correo ya está registrado.");
        if (rolesUsuario != null)
        {
            var resultadoRoles = await AsignarRolesInternoAsync(usuario, rolesUsuario);
            if (resultadoRoles.IsFailure) return resultadoRoles;
        }
        usuario.NombreCompleto = nombreCompleto.Trim(); usuario.Email = email.Trim(); usuario.UserName = email.Trim();
        var resultado = await usuarios.UpdateAsync(usuario);
        if (resultado.Succeeded) resultado = await usuarios.UpdateSecurityStampAsync(usuario);
        return resultado.Succeeded ? Result<bool>.Success(true) : Result<bool>.Failure(Errores(resultado));
    });
    public Task<Result<bool>> CambiarPasswordAsync(Guid usuarioId, string nuevaPassword) => EscribirAsync(async () =>
    {
        var usuario = await usuarios.FindByIdAsync(usuarioId.ToString());
        if (usuario == null) return Result<bool>.Failure("Usuario no encontrado.");
        if (string.IsNullOrWhiteSpace(nuevaPassword)) return Result<bool>.Failure("Ingrese una contraseña.");
        var resultado = await usuarios.ResetPasswordAsync(usuario, await usuarios.GeneratePasswordResetTokenAsync(usuario), nuevaPassword);
        if (!resultado.Succeeded) return Result<bool>.Failure(Errores(resultado));
        resultado = await usuarios.SetLockoutEndDateAsync(usuario, null);
        if (resultado.Succeeded) resultado = await usuarios.ResetAccessFailedCountAsync(usuario);
        return resultado.Succeeded ? Result<bool>.Success(true) : Result<bool>.Failure(Errores(resultado));
    });
    public Task<Result<bool>> CambiarEstadoAsync(Guid usuarioId, bool esActivo) => EscribirAsync(async () =>
    {
        var usuario = await usuarios.FindByIdAsync(usuarioId.ToString());
        if (usuario == null) return Result<bool>.Failure("Usuario no encontrado.");
        if (!esActivo && await EsUltimoAdministradorAsync(usuario)) return Result<bool>.Failure("Debe conservar al menos un administrador activo.");
        usuario.EsActivo = esActivo;
        var resultado = await usuarios.UpdateAsync(usuario);
        if (resultado.Succeeded) resultado = await usuarios.UpdateSecurityStampAsync(usuario);
        return resultado.Succeeded ? Result<bool>.Success(true) : Result<bool>.Failure(Errores(resultado));
    });
    public Task<Result<bool>> AsignarRolesAsync(Guid usuarioId, IEnumerable<string> rolesUsuario) => EscribirAsync(async () =>
    {
        var usuario = await usuarios.FindByIdAsync(usuarioId.ToString());
        return usuario == null ? Result<bool>.Failure("Usuario no encontrado.") : await AsignarRolesInternoAsync(usuario, rolesUsuario);
    });
    private async Task<Result<bool>> AsignarRolesInternoAsync(Usuario usuario, IEnumerable<string> rolesUsuario)
    {
        var elegidos = (rolesUsuario ?? []).Distinct(StringComparer.Ordinal).ToArray();
        if (!await RolesValidosAsync(elegidos)) return Result<bool>.Failure("Seleccione roles válidos del catálogo del sistema.");
        if (!elegidos.Contains(Roles.SuperAdmin) && await EsUltimoAdministradorAsync(usuario)) return Result<bool>.Failure("Debe conservar al menos un administrador activo.");
        var actuales = await usuarios.GetRolesAsync(usuario);
        var resultado = await usuarios.RemoveFromRolesAsync(usuario, actuales.Except(elegidos));
        if (resultado.Succeeded) resultado = await usuarios.AddToRolesAsync(usuario, elegidos.Except(actuales));
        if (resultado.Succeeded) resultado = await usuarios.UpdateSecurityStampAsync(usuario);
        return resultado.Succeeded ? Result<bool>.Success(true) : Result<bool>.Failure(Errores(resultado));
    }
    public async Task<Result<List<string>>> ObtenerRolesUsuarioAsync(Guid usuarioId)
    {
        var usuario = await usuarios.FindByIdAsync(usuarioId.ToString());
        return usuario == null ? Result<List<string>>.Failure("Usuario no encontrado.") : Result<List<string>>.Success((await usuarios.GetRolesAsync(usuario)).ToList());
    }
    public async Task<Result<List<RolDto>>> ObtenerTodosLosRolesAsync()
    {
        var lista = await roles.Roles.Where(x => Roles.Fijos.Contains(x.Name!)).OrderBy(x => x.Modulo).ThenBy(x => x.NombreVisible).ToListAsync();
        return Result<List<RolDto>>.Success(lista.Select(x => new RolDto(x.Id, x.Name!, x.Modulo, x.NombreVisible, x.Descripcion, RolePermissions.GetPermissionsForRole(x.Name!).Order().ToList())).ToList());
    }
}
