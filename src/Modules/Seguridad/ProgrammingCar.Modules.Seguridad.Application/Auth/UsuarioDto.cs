using System;
using System.Collections.Generic;

namespace ProgrammingCar.Modules.Seguridad.Application.Auth;

public record UsuarioDto(
    Guid Id,
    string Email,
    string NombreCompleto,
    bool EsActivo,
    List<string> Roles,
    Guid? SupervisorId = null,
    string? SupervisorNombre = null
);

public record ActualizarUsuarioRequest(
    string NombreCompleto,
    string Email,
    List<string>? Roles = null,
    Guid? SupervisorId = null
);

public record CambiarPasswordRequest(
    string NuevaPassword
);

public record CambiarEstadoUsuarioRequest(
    bool EsActivo
);
