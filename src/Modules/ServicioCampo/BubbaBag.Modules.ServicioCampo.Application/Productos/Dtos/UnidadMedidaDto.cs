using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

public record UnidadMedidaDto(
    Guid Id,
    Guid GrupoUnidadMedidaId,
    string NombreGrupo,
    string Nombre,
    bool EsUnidadBase,
    Guid? UnidadMedidaBaseId,
    decimal Cantidad,
    decimal FactorConversionTotal,
    bool EstaActivo
);

public record UnidadMedidaReferenciaDto(
    Guid Id,
    string Nombre,
    decimal FactorConversionTotal,
    bool EsUnidadBase
);

public record GrupoUnidadMedidaDetalleDto(
    Guid Id,
    string Nombre,
    string? Observacion,
    bool EstaActivo,
    DateTime FechaCreacion,
    DateTime? FechaModificacion,
    List<UnidadMedidaDto> Unidades
);

public record GrupoUnidadMedidaResumenDto(
    Guid Id,
    string Nombre,
    bool EstaActivo,
    int CantidadUnidades
);
