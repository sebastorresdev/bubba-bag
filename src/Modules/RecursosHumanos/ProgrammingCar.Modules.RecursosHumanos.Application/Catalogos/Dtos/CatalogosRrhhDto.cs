using System;
using System.Collections.Generic;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Dtos;

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

public record TurnoCatalogoDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string Horario
);

public record CatalogosRrhhDto(
    List<DepartamentoCatalogoDto> Departamentos,
    List<string> TiposDocumento,
    List<string> TiposContrato,
    List<string> RegimenesPensionarios,
    List<string> EntidadesFinancieras,
    List<EstadoEmpleadoCatalogoDto> Estados,
    List<string> MotivosCese,
    List<TurnoCatalogoDto>? Turnos = null
);
