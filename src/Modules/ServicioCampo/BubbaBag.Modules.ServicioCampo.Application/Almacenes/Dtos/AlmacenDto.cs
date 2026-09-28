using System;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;

public record AlmacenDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    bool Activo,
    TipoAlmacen Tipo = TipoAlmacen.Fisico,
    string? Direccion = null,
    string? Telefono = null,
    Guid? SucursalId = null,
    Guid? RecursoId = null,
    string? NombreSucursal = null,
    string? NombreRecurso = null,
    Guid? RecursoTecnicoId = null
);
