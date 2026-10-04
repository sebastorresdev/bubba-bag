using BubbaBag.Modules.GestionDatos.Application.Dtos;
using BubbaBag.Modules.GestionDatos.Application.Services;
using BubbaBag.Modules.Seguridad.Application.Auth;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;

namespace BubbaBag.Api.Services;

public class UsuariosImportProvider(IAuthService usuarios, ICurrentUser actual) : IEntityImportProvider
{
    public bool Supports(string entidad) => entidad.Equals("Usuario", StringComparison.OrdinalIgnoreCase);
    public IEnumerable<EntityImportDescriptorDto> GetDescriptors()
    {
        if (!actual.IsAuthenticated || !actual.HasPermission(Permissions.Seguridad.UsuariosGestionar)) return [];
        return [new EntityImportDescriptorDto
        {
            EntityName = "Usuario", DisplayName = "Usuarios de acceso", IconName = "People", PrimaryKeyField = "Email",
            Description = "Las cuentas nuevas se crean INACTIVAS y sin contraseña. Restablezca su contraseña y actívelas en Usuarios. No incluya contraseñas en el archivo. La actualización conserva el estado y contraseña existentes.",
            Fields = [new("Email", "Correo electrónico", true, true, "text", null, null, "correo", "email", "correo electrónico"),
                new("NombreCompleto", "Nombre completo", true, true, "text", null, null, "nombre", "nombre completo"),
                new("Roles", "Códigos de roles separados por punto y coma", false, false, "text", null, null, "roles", "perfil")]
        }];
    }
    public async Task<EntityImportExecutionResult> ImportAsync(string entityName, IReadOnlyList<Dictionary<string, string>> filas, string duplicateMode, CancellationToken cancellationToken = default)
    {
        if (!actual.IsAuthenticated || !actual.HasPermission(Permissions.Seguridad.UsuariosGestionar)) throw new UnauthorizedAccessException("No tiene permiso para importar usuarios.");
        if (!Supports(entityName)) throw new NotSupportedException("Entidad no soportada.");
        var errores = new List<EntityImportRowError>();
        var exitosos = 0;
        for (var i = 0; i < filas.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var fila = filas[i];
            var email = fila.GetValueOrDefault("Email", "").Trim();
            var roles = fila.GetValueOrDefault("Roles", "").Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            var resultado = await usuarios.ImportarUsuarioAsync(email, fila.GetValueOrDefault("NombreCompleto", ""), roles, duplicateMode);
            if (resultado.IsSuccess) exitosos++;
            else errores.Add(new(i + 2, resultado.Error, email));
        }
        return new(filas.Count, exitosos, errores.Count, 0, errores);
    }
}
