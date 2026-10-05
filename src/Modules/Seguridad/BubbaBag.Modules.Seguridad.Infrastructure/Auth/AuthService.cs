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
            if (!await roles.RoleExistsAsync(rol)) return false;
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
        var lista = await roles.Roles.OrderBy(x => x.Modulo).ThenBy(x => x.NombreVisible).ToListAsync();
        var claims = await db.RoleClaims.Where(rc => rc.ClaimType == "permission").ToListAsync();
        var userRoles = await db.UserRoles.ToListAsync();

        var dtos = lista.Select(x =>
        {
            var perms = string.Equals(x.Name, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase)
                ? Permissions.GetAll().Order().ToList()
                : claims.Where(rc => rc.RoleId == x.Id).Select(rc => rc.ClaimValue!).Distinct().Order().ToList();

            if (perms.Count == 0 && !string.IsNullOrEmpty(x.Name))
            {
                perms = RolePermissions.GetPermissionsForRole(x.Name).Order().ToList();
            }

            bool esSistema = Roles.Fijos.Contains(x.Name!);
            int usersCount = userRoles.Count(ur => ur.RoleId == x.Id);

            return new RolDto(x.Id, x.Name!, x.Modulo, x.NombreVisible, x.Descripcion, perms, esSistema, usersCount);
        }).ToList();

        return Result<List<RolDto>>.Success(dtos);
    }
    public async Task<Result<RolDto>> ObtenerRolPorIdAsync(Guid rolId)
    {
        var x = await roles.FindByIdAsync(rolId.ToString());
        if (x == null) return Result<RolDto>.Failure("Rol no encontrado.");

        var claims = await db.RoleClaims.Where(rc => rc.RoleId == x.Id && rc.ClaimType == "permission").Select(rc => rc.ClaimValue!).ToListAsync();
        var perms = string.Equals(x.Name, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase)
            ? Permissions.GetAll().Order().ToList()
            : claims.Distinct().Order().ToList();

        if (perms.Count == 0 && !string.IsNullOrEmpty(x.Name))
        {
            perms = RolePermissions.GetPermissionsForRole(x.Name).Order().ToList();
        }

        bool esSistema = Roles.Fijos.Contains(x.Name!);
        var usersCount = await db.UserRoles.CountAsync(ur => ur.RoleId == x.Id);

        return Result<RolDto>.Success(new RolDto(x.Id, x.Name!, x.Modulo, x.NombreVisible, x.Descripcion, perms, esSistema, usersCount));
    }
    public Task<Result<Guid>> CrearRolAsync(string nombreVisible, string? codigo, string modulo, string descripcion, IEnumerable<string> permisos) => EscribirAsync(async () =>
    {
        if (string.IsNullOrWhiteSpace(nombreVisible) || nombreVisible.Trim().Length > 150)
            return Result<Guid>.Failure("El nombre del rol es requerido y debe tener hasta 150 caracteres.");

        var cod = string.IsNullOrWhiteSpace(codigo)
            ? System.Text.RegularExpressions.Regex.Replace(nombreVisible.Trim(), @"[^a-zA-Z0-9]", "")
            : System.Text.RegularExpressions.Regex.Replace(codigo.Trim(), @"[^a-zA-Z0-9]", "");

        if (string.IsNullOrWhiteSpace(cod) || cod.Length > 100)
            return Result<Guid>.Failure("El código identificador debe ser alfanumérico.");

        if (await roles.RoleExistsAsync(cod))
            return Result<Guid>.Failure($"Ya existe un rol con el código '{cod}'.");

        var mod = string.IsNullOrWhiteSpace(modulo) ? "Personalizado" : modulo.Trim();
        var desc = descripcion?.Trim() ?? string.Empty;

        var nuevoRol = new Rol
        {
            Name = cod,
            NombreVisible = nombreVisible.Trim(),
            Modulo = mod,
            Descripcion = desc
        };

        var resultado = await roles.CreateAsync(nuevoRol);
        if (!resultado.Succeeded) return Result<Guid>.Failure(Errores(resultado));

        var validos = Permissions.GetAll();
        var listaPermisos = (permisos ?? []).Where(p => validos.Contains(p)).Distinct().ToList();

        foreach (var p in listaPermisos)
        {
            await roles.AddClaimAsync(nuevoRol, new System.Security.Claims.Claim("permission", p));
        }

        RolePermissions.SetRolePermissions(cod, listaPermisos);
        return Result<Guid>.Success(nuevoRol.Id);
    });
    public Task<Result<bool>> ActualizarRolAsync(Guid rolId, string nombreVisible, string modulo, string descripcion, IEnumerable<string> permisos) => EscribirAsync(async () =>
    {
        var rol = await roles.FindByIdAsync(rolId.ToString());
        if (rol == null) return Result<bool>.Failure("Rol no encontrado.");

        if (string.Equals(rol.Name, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase) || Roles.Fijos.Contains(rol.Name!))
            return Result<bool>.Failure($"El rol '{rol.NombreVisible}' es un rol predefinido del sistema y no puede modificarse.");

        if (string.IsNullOrWhiteSpace(nombreVisible) || nombreVisible.Trim().Length > 150)
            return Result<bool>.Failure("El nombre visible es requerido.");

        rol.NombreVisible = nombreVisible.Trim();
        if (!string.IsNullOrWhiteSpace(modulo)) rol.Modulo = modulo.Trim();
        rol.Descripcion = descripcion?.Trim() ?? string.Empty;

        var resultado = await roles.UpdateAsync(rol);
        if (!resultado.Succeeded) return Result<bool>.Failure(Errores(resultado));

        if (!string.Equals(rol.Name, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase))
        {
            var validos = Permissions.GetAll();
            var listaPermisos = (permisos ?? []).Where(p => validos.Contains(p)).Distinct().ToList();

            var claimsActuales = await roles.GetClaimsAsync(rol);
            var permClaims = claimsActuales.Where(c => c.Type == "permission").ToList();

            foreach (var c in permClaims.Where(c => !listaPermisos.Contains(c.Value)))
            {
                await roles.RemoveClaimAsync(rol, c);
            }

            foreach (var p in listaPermisos.Where(p => !permClaims.Any(c => c.Value == p)))
            {
                await roles.AddClaimAsync(rol, new System.Security.Claims.Claim("permission", p));
            }

            RolePermissions.SetRolePermissions(rol.Name!, listaPermisos);

            var usuariosEnRol = await usuarios.GetUsersInRoleAsync(rol.Name!);
            foreach (var u in usuariosEnRol)
            {
                await usuarios.UpdateSecurityStampAsync(u);
            }
        }

        return Result<bool>.Success(true);
    });
    public Task<Result<bool>> EliminarRolAsync(Guid rolId) => EscribirAsync(async () =>
    {
        var rol = await roles.FindByIdAsync(rolId.ToString());
        if (rol == null) return Result<bool>.Failure("Rol no encontrado.");

        if (string.Equals(rol.Name, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase))
            return Result<bool>.Failure("No se puede eliminar el rol Super Administrador del sistema.");

        if (Roles.Fijos.Contains(rol.Name!))
            return Result<bool>.Failure($"El rol '{rol.NombreVisible}' es un rol predefinido del sistema y no puede eliminarse.");

        var count = await db.UserRoles.CountAsync(ur => ur.RoleId == rol.Id);
        if (count > 0)
            return Result<bool>.Failure($"No se puede eliminar el rol '{rol.NombreVisible}' porque está asignado a {count} usuario(s). Desasigne el rol primero.");

        var claims = await roles.GetClaimsAsync(rol);
        foreach (var c in claims)
        {
            await roles.RemoveClaimAsync(rol, c);
        }

        var resultado = await roles.DeleteAsync(rol);
        if (!resultado.Succeeded) return Result<bool>.Failure(Errores(resultado));

        RolePermissions.RemoveRole(rol.Name!);
        return Result<bool>.Success(true);
    });
    public Task<Result<List<PermisoDefinicionDto>>> ObtenerCatalogoPermisosAsync()
    {
        var catalogo = new List<PermisoDefinicionDto>
        {
            // Inventario
            new(Permissions.Inventario.Acceso, "Inventario", "Acceso al módulo", "Consultar inventario, productos, almacenes y movimientos."),
            new(Permissions.Inventario.CatalogosGestionar, "Inventario", "Gestionar catálogos", "Crear y modificar productos, almacenes, sedes y categorías."),
            new(Permissions.Inventario.Operar, "Inventario", "Operar movimientos", "Registrar recepciones, despachos y transferencias en almacenes."),
            new(Permissions.Inventario.AccesosGestionar, "Inventario", "Gestionar autorizaciones", "Asignar autorizaciones y permisos de acceso por almacén."),

            // Servicio de Campo
            new(Permissions.ServicioCampo.Acceso, "Servicio de Campo", "Acceso al módulo", "Acceder al portal operativo de servicio de campo."),
            new(Permissions.ServicioCampo.OrdenesVerTodas, "Servicio de Campo", "Ver todas las órdenes", "Visualizar el listado general de órdenes de trabajo de toda la organización."),
            new(Permissions.ServicioCampo.OrdenesVerAsignadas, "Servicio de Campo", "Ver órdenes asignadas", "Visualizar únicamente las órdenes asignadas a su técnico o cuadrilla."),
            new(Permissions.ServicioCampo.OrdenesCrear, "Servicio de Campo", "Crear órdenes", "Registrar nuevas órdenes de trabajo de servicio."),
            new(Permissions.ServicioCampo.OrdenesAsignar, "Servicio de Campo", "Asignar órdenes", "Despachar y asignar órdenes de trabajo a recursos técnicos."),
            new(Permissions.ServicioCampo.OrdenesOperarCampo, "Servicio de Campo", "Operar en campo", "Registrar traslados, check-in, checklists y evidencias en sitio."),
            new(Permissions.ServicioCampo.OrdenesCerrar, "Servicio de Campo", "Cerrar órdenes", "Finalizar, liquidar y cerrar técnicamente órdenes de trabajo."),
            new(Permissions.ServicioCampo.CatalogosGestionar, "Servicio de Campo", "Gestionar catálogos", "Parametrizar tarifarios, tipos de orden y servicios."),

            // CRM y Clientes
            new(Permissions.Crm.Acceso, "CRM y Clientes", "Acceso al módulo", "Acceder al directorio comercial de clientes y contactos."),
            new(Permissions.Crm.ClientesVer, "CRM y Clientes", "Consultar clientes", "Visualizar fichas y datos de clientes."),
            new(Permissions.Crm.ClientesCrear, "CRM y Clientes", "Crear clientes", "Registrar nuevos clientes en la cartera comercial."),
            new(Permissions.Crm.ClientesEditar, "CRM y Clientes", "Editar clientes", "Modificar información comercial y de contacto de clientes."),
            new(Permissions.Crm.ClientesEliminar, "CRM y Clientes", "Eliminar clientes", "Desactivar o eliminar clientes de la cartera."),
            new(Permissions.Crm.SegmentacionAvanzada, "CRM y Clientes", "Segmentación comercial", "Acceso a filtros avanzados y segmentación de clientes."),

            // Recursos Humanos
            new(Permissions.Rrhh.Acceso, "Recursos Humanos", "Acceso al módulo", "Acceder a la gestión de personal y colaboradores."),
            new(Permissions.Rrhh.ColaboradoresVer, "Recursos Humanos", "Consultar colaboradores", "Visualizar el directorio de colaboradores."),
            new(Permissions.Rrhh.ColaboradoresGestionar, "Recursos Humanos", "Gestionar colaboradores", "Dar de alta, actualizar datos laborales y cesar colaboradores."),
            new(Permissions.Rrhh.SalariosConfidencial, "Recursos Humanos", "Salarios confidenciales", "Acceso a remuneraciones, sueldos y cuentas bancarias."),
            new(Permissions.Rrhh.CatalogosGestionar, "Recursos Humanos", "Gestionar catálogos", "Parametrizar cargos, departamentos y tipos de contrato."),

            // Seguridad
            new(Permissions.Seguridad.Acceso, "Seguridad", "Acceso al módulo", "Consultar el directorio de usuarios y catálogo de roles."),
            new(Permissions.Seguridad.UsuariosGestionar, "Seguridad", "Gestionar usuarios", "Crear usuarios, asignar roles y restablecer contraseñas."),
            new(Permissions.Seguridad.RolesGestionar, "Seguridad", "Gestionar roles y permisos", "Crear, modificar y eliminar roles y su matriz de permisos.")
        };

        return Task.FromResult(Result<List<PermisoDefinicionDto>>.Success(catalogo));
    }
}

