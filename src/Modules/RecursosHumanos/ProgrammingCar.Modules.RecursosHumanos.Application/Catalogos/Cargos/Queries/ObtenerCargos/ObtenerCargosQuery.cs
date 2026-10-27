using System;
using System.Collections.Generic;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargos;

public record ObtenerCargosQuery(
    Guid? DepartamentoId = null,
    bool? SoloActivos = null,
    string? SearchTerm = null
) : IQuery<Result<List<CargoDetalleDto>>>;
