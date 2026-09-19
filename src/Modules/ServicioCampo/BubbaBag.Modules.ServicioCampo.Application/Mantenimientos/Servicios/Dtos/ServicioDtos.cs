using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Dtos;

public record ServicioPasoDto(
    Guid? Id,
    int NumeroPaso,
    string Descripcion,
    bool RequiereFoto,
    int TipoEvidencia,
    bool EsObligatorio
);

public record ServicioMaterialDto(
    Guid? Id,
    Guid ProductoId,
    string? ProductoCodigo,
    string? ProductoNombre,
    decimal CantidadTeorica,
    string UnidadMedida
);

public record SucursalServicioDto(
    Guid? Id,
    Guid SucursalId,
    string? SucursalNombre,
    string? SucursalCiudad,
    bool Habilitado
);

public record ServicioItemDto(
    Guid Id,
    string Codigo,
    string Nombre,
    Guid CatalogoServicioId,
    string CatalogoServicioNombre,
    int DuracionEstimadaMinutos,
    string? CodigoExterno,
    int CantidadPasos,
    int CantidadMateriales,
    bool Activo
);

public record ServicioDetalleDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    Guid CatalogoServicioId,
    string CatalogoServicioNombre,
    int DuracionEstimadaMinutos,
    string? CodigoExterno,
    bool Activo,
    List<ServicioPasoDto> Pasos,
    List<ServicioMaterialDto> MaterialesTeoricos,
    List<SucursalServicioDto> SucursalesHabilitadas
);
