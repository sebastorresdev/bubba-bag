using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Dtos;

public record CargoCatalogoDto(
    Guid Id,
    string Nombre,
    decimal? SalarioReferencial
);

public record DepartamentoCatalogoDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    List<CargoCatalogoDto> Cargos
);

public record EstadoEmpleadoCatalogoDto(
    string Id,
    string Label,
    string Color
);

public record CatalogosRrhhDto(
    List<DepartamentoCatalogoDto> Departamentos,
    List<string> TiposDocumento,
    List<string> TiposContrato,
    List<string> RegimenesPensionarios,
    List<string> EntidadesFinancieras,
    List<EstadoEmpleadoCatalogoDto> Estados,
    List<string> MotivosCese
);
