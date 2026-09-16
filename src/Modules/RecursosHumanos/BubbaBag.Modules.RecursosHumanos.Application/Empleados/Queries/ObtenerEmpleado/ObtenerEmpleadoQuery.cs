using System;
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Queries.ObtenerEmpleado;

public record ObtenerEmpleadoQuery(Guid Id) : IQuery<Result<EmpleadoDto>>;
