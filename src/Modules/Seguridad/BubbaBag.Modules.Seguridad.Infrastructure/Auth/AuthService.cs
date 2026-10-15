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
    private async Task<Result<T>> EscribirAsync<T>(Func<Task<Result<T>>> accion, Action? postCommit = null)
    {
        if (!db.Database.IsRelational() || db.Database.CurrentTransaction != null)
        {
            var res = await accion();
            if (res.IsSuccess) postCommit?.Invoke();
            return res;
        }
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
                if (resultado.IsSuccess)
                {
                    await transaccion.CommitAsync();
                    postCommit?.Invoke();
                }
                else
                {
                    await transaccion.RollbackAsync();
                    db.ChangeTracker.Clear();
                }
                return resultado;
            }
            catch
            {
                db.ChangeTracker.Clear();
                throw;
            }
        });
    }

    private Task<Result<T>> EscribirConPostCommitAsync<T>(Func<Action<Action>, Task<Result<T>>> accion)
    {
        var postCommitActions = new List<Action>();
        return EscribirAsync(
            () => accion(postCommitActions.Add),
            () => { foreach (var act in postCommitActions) act(); }
        );
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

        var listaUsuarios = await consulta.OrderBy(x => x.NombreCompleto).ToListAsync();
        if (listaUsuarios.Count == 0) return Result<List<UsuarioDto>>.Success([]);

        var userIds = listaUsuarios.Select(u => u.Id).ToList();

        // Consulta por lotes única para evitar N+1
        var rolesPorUsuario = await (
            from ur in db.UserRoles.AsNoTracking()
            join r in db.Roles.AsNoTracking() on ur.RoleId equals r.Id
            where userIds.Contains(ur.UserId)
            select new { ur.UserId, RoleName = r.Name }
        ).ToListAsync();

        var lookupRoles = rolesPorUsuario
            .Where(x => !string.IsNullOrEmpty(x.RoleName))
            .ToLookup(x => x.UserId, x => x.RoleName!);

        var lista = listaUsuarios.Select(u => new UsuarioDto(
            u.Id,
            u.Email ?? "",
            u.NombreCompleto,
            u.EsActivo,
            lookupRoles[u.Id].ToList()
        )).ToList();

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
    public Task<Result<Guid>> CrearRolAsync(string nombreVisible, string? codigo, string modulo, string descripcion, IEnumerable<string> permisos) => EscribirConPostCommitAsync(async onCommit =>
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
            var resClaim = await roles.AddClaimAsync(nuevoRol, new System.Security.Claims.Claim("permission", p));
            if (!resClaim.Succeeded) return Result<Guid>.Failure(Errores(resClaim));
        }

        onCommit(() => RolePermissions.SetRolePermissions(cod, listaPermisos));
        return Result<Guid>.Success(nuevoRol.Id);
    });
    public Task<Result<bool>> ActualizarRolAsync(Guid rolId, string nombreVisible, string modulo, string descripcion, IEnumerable<string> permisos) => EscribirConPostCommitAsync(async onCommit =>
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
                var resRemove = await roles.RemoveClaimAsync(rol, c);
                if (!resRemove.Succeeded) return Result<bool>.Failure(Errores(resRemove));
            }

            foreach (var p in listaPermisos.Where(p => !permClaims.Any(c => c.Value == p)))
            {
                var resAdd = await roles.AddClaimAsync(rol, new System.Security.Claims.Claim("permission", p));
                if (!resAdd.Succeeded) return Result<bool>.Failure(Errores(resAdd));
            }

            var usuariosEnRol = await usuarios.GetUsersInRoleAsync(rol.Name!);
            foreach (var u in usuariosEnRol)
            {
                var resStamp = await usuarios.UpdateSecurityStampAsync(u);
                if (!resStamp.Succeeded) return Result<bool>.Failure(Errores(resStamp));
            }

            onCommit(() => RolePermissions.SetRolePermissions(rol.Name!, listaPermisos));
        }

        return Result<bool>.Success(true);
    });
    public Task<Result<bool>> EliminarRolAsync(Guid rolId) => EscribirConPostCommitAsync(async onCommit =>
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
            var resRemove = await roles.RemoveClaimAsync(rol, c);
            if (!resRemove.Succeeded) return Result<bool>.Failure(Errores(resRemove));
        }

        var nombreRol = rol.Name!;
        var resultado = await roles.DeleteAsync(rol);
        if (!resultado.Succeeded) return Result<bool>.Failure(Errores(resultado));

        onCommit(() => RolePermissions.RemoveRole(nombreRol));
        return Result<bool>.Success(true);
    });
    public Task<Result<List<PermisoDefinicionDto>>> ObtenerCatalogoPermisosAsync()
    {
        var catalogo = new List<PermisoDefinicionDto>
        {
            // Configuración institucional: la lectura requiere únicamente iniciar sesión.
            new(Permissions.Configuracion.EmpresaDatosFiscalesGestionar, "Empresa y sucursales", "Modificar datos fiscales de la empresa", "Cambiar razón social, nombre comercial, RUC y dirección fiscal. Consultar estos datos o incluirlos en un PDF sólo requiere una sesión válida y acceso a la operación correspondiente."),
            new(Permissions.Configuracion.EmpresaPresentacionGestionar, "Empresa y sucursales", "Modificar logo y contacto de la empresa", "Cambiar teléfono, correo, logo y pie de documentos. No permite modificar la razón social, RUC ni dirección fiscal."),
            new(Permissions.Configuracion.SucursalesGestionar, "Empresa y sucursales", "Crear y editar sucursales, sedes y bases", "Registrar sucursales y sedes operativas, y editar nombre, ciudad, dirección y teléfono. Cambiar la sede principal y activar o desactivar requieren permisos separados."),
            new(Permissions.Configuracion.SucursalesSedePrincipalGestionar, "Empresa y sucursales", "Cambiar la sede principal", "Marcar o desmarcar una sucursal o sede como principal. Para guardar los demás datos se necesita también Crear y editar sucursales, sedes y bases."),
            new(Permissions.Configuracion.SucursalesEstadoGestionar, "Empresa y sucursales", "Activar o desactivar sucursales, sedes y bases", "Habilitar o deshabilitar una sucursal o sede operativa. Consultar y editar datos generales son autorizaciones distintas."),
            // Inventario
            new(Permissions.Inventario.Acceso, "Inventario", "Consultar inventario y documentos", "Consultar productos, almacenes, existencias, compras y movimientos dentro del alcance autorizado. La consulta no permite registrar movimientos."),
            new(Permissions.Inventario.CatalogosGestionar, "Inventario", "Administrar productos y almacenes", "Crear y editar productos, categorías, unidades de medida, almacenes, territorios y recursos. Administrar sucursales y sedes requiere los permisos de Empresa y sucursales. Requiere también Consultar inventario y documentos."),
            new(Permissions.Inventario.Operar, "Inventario", "Registrar compras y movimientos de inventario", "Registrar compras, recepciones, despachos, transferencias y ajustes. Requiere acceso a Inventario; los movimientos también exigen autorización en los almacenes involucrados."),
            new(Permissions.Inventario.AccesosGestionar, "Inventario", "Administrar autorizaciones por almacén", "Identifica la administración de accesos por almacén. Actualmente modificar autorizaciones también requiere Administrador de inventario, Administrador de Servicio de Campo o Super Administrador; un rol personalizado con esta casilla no basta."),

            // Servicio de Campo
            new(Permissions.ServicioCampo.Acceso, "Servicio de Campo", "Consultar Servicio de Campo y órdenes", "Entrar al módulo. Las órdenes visibles requieren autorización para consultar todas, consultar las asignadas o gestionar las creadas por el usuario."),
            new(Permissions.ServicioCampo.OrdenesVerTodas, "Servicio de Campo", "Consultar todas las órdenes", "Consultar órdenes de toda la organización. Requiere acceso a Servicio de Campo; modificar o cerrar exige su permiso específico."),
            new(Permissions.ServicioCampo.OrdenesVerAsignadas, "Servicio de Campo", "Consultar órdenes asignadas", "Consultar y operar, con los permisos correspondientes, las órdenes cuya asignación más reciente corresponde al recurso vinculado a su usuario."),
            new(Permissions.ServicioCampo.OrdenesCrear, "Servicio de Campo", "Crear, editar y eliminar órdenes de trabajo", "Registrar, editar y eliminar órdenes y sus trabajos cuando su estado lo permita. Programar y completar trabajos son acciones con permisos separados. Requiere acceso a Servicio de Campo."),
            new(Permissions.ServicioCampo.OrdenesAsignar, "Servicio de Campo", "Programar y cambiar el estado de órdenes", "Programar la atención y cambiar el estado de las órdenes según las reglas de la operación. Requiere acceso a Servicio de Campo."),
            new(Permissions.ServicioCampo.OrdenesOperarCampo, "Servicio de Campo", "Completar trabajos y tareas de campo", "Completar tareas y trabajos dentro de las órdenes autorizadas. Requiere acceso a Servicio de Campo y autorización de consulta sobre la orden."),
            new(Permissions.ServicioCampo.OrdenesCerrar, "Servicio de Campo", "Completar o cancelar órdenes", "Cambiar una orden autorizada a Completado o Cancelado. El cierre conserva las validaciones de trabajos pendientes; programar requiere un permiso separado."),
            new(Permissions.ServicioCampo.CatalogosGestionar, "Servicio de Campo", "Administrar tipos de orden y servicios", "Crear y editar tipos de orden, tareas, motivos de incidencia y configuraciones de servicio. Requiere acceso a Servicio de Campo."),

            // CRM y Clientes
            new(Permissions.Crm.Acceso, "CRM y Clientes", "Acceder a CRM y Clientes", "Entrar al módulo de clientes. Seleccione Consultar clientes para abrir el directorio y las fichas; crear y editar requieren sus propios permisos."),
            new(Permissions.Crm.ClientesVer, "CRM y Clientes", "Consultar fichas de clientes", "Ver el directorio, datos de identificación, direcciones y contactos de clientes. Requiere acceso a CRM y Clientes para usar sus pantallas."),
            new(Permissions.Crm.ClientesCrear, "CRM y Clientes", "Registrar nuevos clientes", "Crear clientes en el directorio. Para consultar sus fichas seleccione también Consultar fichas de clientes y acceso a CRM y Clientes."),
            new(Permissions.Crm.ClientesEditar, "CRM y Clientes", "Editar y activar o desactivar clientes", "Modificar datos comerciales y de contacto, y activar o desactivar clientes. Para consultar sus fichas seleccione también Consultar fichas de clientes y acceso a CRM y Clientes."),
            new(Permissions.Crm.ClientesEliminar, "CRM y Clientes", "Eliminar clientes (función prevista)", "La eliminación de registros aún no está disponible. Para activar o desactivar clientes use Editar y activar o desactivar clientes; este permiso no lo sustituye."),
            new(Permissions.Crm.SegmentacionAvanzada, "CRM y Clientes", "Segmentación comercial (función prevista)", "Reservado para segmentación comercial avanzada. Actualmente no habilita una función adicional de segmentación."),

            // Recursos Humanos
            new(Permissions.Rrhh.Acceso, "Recursos Humanos", "Acceder a Recursos Humanos", "Entrar al módulo y consultar sus catálogos. Consultar colaboradores, gestionarlos y acceder a información confidencial requieren permisos separados."),
            new(Permissions.Rrhh.ColaboradoresVer, "Recursos Humanos", "Consultar datos de colaboradores", "Consultar fichas y datos laborales. Los salarios y cuentas bancarias se ocultan sin el permiso de información confidencial. Requiere acceso a Recursos Humanos."),
            new(Permissions.Rrhh.ColaboradoresGestionar, "Recursos Humanos", "Registrar, editar y cesar colaboradores", "Registrar, editar, cesar y reactivar colaboradores. No permite modificar salarios ni cuentas bancarias sin el permiso confidencial. Requiere acceso a Recursos Humanos."),
            new(Permissions.Rrhh.SalariosConfidencial, "Recursos Humanos", "Acceder a salarios y datos bancarios", "Consultar remuneraciones, pensiones, salarios referenciales y cuentas bancarias. Modificarlos requiere además gestionar colaboradores o catálogos, según corresponda."),
            new(Permissions.Rrhh.CatalogosGestionar, "Recursos Humanos", "Administrar cargos y departamentos", "Crear, editar y activar o desactivar cargos y departamentos. Modificar salarios referenciales requiere además información confidencial. Requiere acceso a Recursos Humanos."),

            new(Permissions.Inventario.AjustesAprobar, "Inventario", "Aprobar o rechazar ajustes de inventario", "Aplicar o rechazar ajustes dentro de almacenes donde tenga autorización de consulta y supervisor. Aplicar modifica existencias y Kardex; registrar ajustes requiere Operar inventario."),
            new(Permissions.GestionDatos.Importar, "Importaciones", "Importar datos desde archivos", "Previsualizar e importar datos sólo de entidades que pueda gestionar. Inventario inicial requiere autorización de recepción en el almacén; actualizar clientes requiere permiso de edición."),
            new(Permissions.GestionDatos.HistorialVer, "Importaciones", "Consultar mis importaciones", "Consultar el historial propio de entidades que pueda consultar. No permite importar ni eliminar registros."),
            new(Permissions.GestionDatos.HistorialVerTodas, "Importaciones", "Consultar importaciones de otras personas de mi área", "Ampliar el historial a otros responsables dentro de las entidades autorizadas. Requiere Consultar mis importaciones y no abre información de otras áreas."),
            new(Permissions.GestionDatos.HistorialEliminar, "Importaciones", "Eliminar registros del historial", "Eliminar registros terminados dentro del alcance autorizado; no elimina los datos importados. El historial de otras personas requiere su permiso adicional. Los procesos en curso no se pueden eliminar."),
            // Seguridad
            new(Permissions.Seguridad.Acceso, "Seguridad", "Consultar usuarios, roles y permisos", "Consultar el directorio de usuarios y el catálogo de roles y permisos. Modificar empresa, sucursales o cuentas de usuario requiere sus permisos específicos."),
            new(Permissions.Seguridad.UsuariosGestionar, "Seguridad", "Administrar usuarios y asignarles roles", "Crear y editar usuarios, habilitar o deshabilitar cuentas, asignar roles y restablecer contraseñas. Requiere acceso a Seguridad para usar sus pantallas."),
            new(Permissions.Seguridad.RolesGestionar, "Seguridad", "Crear roles personalizados y asignar permisos", "Crear, editar y eliminar roles personalizados y elegir sus permisos. Los roles predefinidos están protegidos. Requiere acceso a Seguridad para usar sus pantallas.")
        };

        return Task.FromResult(Result<List<PermisoDefinicionDto>>.Success(catalogo));
    }
}

