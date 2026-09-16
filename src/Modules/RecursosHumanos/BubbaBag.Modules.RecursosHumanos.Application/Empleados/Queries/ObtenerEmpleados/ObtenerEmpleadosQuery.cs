using System;
using System.Collections.Generic;
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Queries.ObtenerEmpleados;

public record ObtenerEmpleadosQuery(
    string? SearchTerm,
    EstadoEmpleado? Estado = null,
    Guid? DepartamentoId = null,
    Guid? CargoId = null,
    int Page = 1,
    int PageSize = 20
) : IQuery<Result<List<EmpleadoDto>>>;
