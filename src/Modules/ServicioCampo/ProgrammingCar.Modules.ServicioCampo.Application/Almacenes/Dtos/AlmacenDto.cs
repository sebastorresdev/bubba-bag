using System;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Dtos;

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
    bool PuedeDespachar = false, bool PuedeRecepcionar = false, bool EsSupervisor = false,
    Guid? AlmacenPadreId = null,
    string? AlmacenPadreNombre = null
);
