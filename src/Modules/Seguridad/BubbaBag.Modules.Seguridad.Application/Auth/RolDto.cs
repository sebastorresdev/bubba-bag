using System;

namespace BubbaBag.Modules.Seguridad.Application.Auth;

public record RolDto(
    Guid Id,
    string Codigo,
    string Modulo,
    string NombreVisible,
    string Descripcion
);
