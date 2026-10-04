using System;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record AlmacenDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    TipoAlmacen Tipo,
    Guid? UnidadOrganizativaId,
    string? UnidadOrganizativaNombre,
    Guid? RecursoId,
    string? RecursoNombre,
    bool Activo,
    Guid? CreadoPorId,
    string? CreadoPorNombre,
    DateTime CreatedAt,
    Guid? ActualizadoPorId,
    DateTime? UpdatedAt,
    bool PuedeDespachar = false, bool PuedeRecepcionar = false, bool EsSupervisor = false
);
