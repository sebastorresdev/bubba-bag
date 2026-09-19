using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Dtos;

public record CatalogoServicioDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    Guid? ContratanteId,
    string? ContratanteNombre,
    int CantidadServicios,
    bool Activo
);
