using System;
using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record AlmacenDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    bool Activo,
    Guid? CreadoPorId,
    string? CreadoPorNombre,
    DateTime CreatedAt,
    Guid? ActualizadoPorId,
    DateTime? UpdatedAt
);
