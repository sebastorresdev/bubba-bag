namespace BubbaBag.Modules.Seguridad.Application.Auth;

public record PermisoDefinicionDto(
    string Codigo,
    string Modulo,
    string Titulo,
    string Descripcion
);
