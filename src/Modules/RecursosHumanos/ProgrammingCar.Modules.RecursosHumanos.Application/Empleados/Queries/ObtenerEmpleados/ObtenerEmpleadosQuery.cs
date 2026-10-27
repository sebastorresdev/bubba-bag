using System;
using System.Collections.Generic;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Dtos;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Empleados;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Queries.ObtenerEmpleados;

public record ObtenerEmpleadosQuery(
    string? SearchTerm,
    EstadoEmpleado? Estado = null,
    Guid? DepartamentoId = null,
    Guid? CargoId = null,
    int Page = 1,
    int PageSize = 20
) : IQuery<Result<List<EmpleadoDto>>>;
