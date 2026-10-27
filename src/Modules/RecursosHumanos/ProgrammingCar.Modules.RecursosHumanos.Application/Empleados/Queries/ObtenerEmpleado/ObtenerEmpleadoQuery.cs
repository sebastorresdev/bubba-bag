using System;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Queries.ObtenerEmpleado;

public record ObtenerEmpleadoQuery(Guid Id) : IQuery<Result<EmpleadoDto>>;
