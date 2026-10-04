using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.Seguridad.Application.Auth;

public record UsuarioDto(
    Guid Id,
    string Email,
    string NombreCompleto,
    bool EsActivo,
    List<string> Roles
);

public record ActualizarUsuarioRequest(
    string NombreCompleto,
    string Email,
    List<string>? Roles = null
);

public record CambiarPasswordRequest(
    string NuevaPassword
);

public record CambiarEstadoUsuarioRequest(
    bool EsActivo
);
