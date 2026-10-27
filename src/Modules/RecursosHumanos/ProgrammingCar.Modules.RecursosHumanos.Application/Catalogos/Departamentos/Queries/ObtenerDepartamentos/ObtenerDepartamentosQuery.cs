using System.Collections.Generic;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentos;

public record ObtenerDepartamentosQuery(
    bool? SoloActivos = null,
    string? SearchTerm = null
) : IQuery<Result<List<DepartamentoDetalleDto>>>;
