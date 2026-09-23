using System;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record AlmacenDto(
    Guid Id,
    string Codigo,
    string Nombre,
    TipoAlmacen Tipo,
    string? Direccion,
    string? Telefono,
    Guid? SucursalId,
    Guid? RecursoTecnicoId,
    bool Activo
);
