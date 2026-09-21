using System;

namespace BubbaBag.Modules.Seguridad.Application.Vistas;

public record VistaUsuarioDto(
    Guid Id,
    string Entidad,
    string Nombre,
    string? Descripcion,
    bool EsPredeterminada,
    bool EsSistema,
    string ConfiguracionJson,
    DateTime FechaCreacion
);

public record GuardarVistaRequest(
    string Entidad,
    string Nombre,
    string? Descripcion,
    string ConfiguracionJson,
    bool EsPredeterminada
);

public record EstablecerPredeterminadaRequest(
    string Entidad,
    Guid? VistaId,
    string? VistaKey
);
