using System;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargoPorId;

public record ObtenerCargoPorIdQuery(Guid Id) : IQuery<Result<CargoDetalleDto>>;
