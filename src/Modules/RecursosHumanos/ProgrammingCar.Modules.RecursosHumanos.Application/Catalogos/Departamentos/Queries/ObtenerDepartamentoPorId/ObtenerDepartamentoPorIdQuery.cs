using System;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentoPorId;

public record ObtenerDepartamentoPorIdQuery(Guid Id) : IQuery<Result<DepartamentoDetalleDto>>;
