using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Dtos;

public record CatalogoServicioDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    Guid? ClienteId,
    string? ClienteNombre,
    int CantidadServicios,
    bool Activo
);
