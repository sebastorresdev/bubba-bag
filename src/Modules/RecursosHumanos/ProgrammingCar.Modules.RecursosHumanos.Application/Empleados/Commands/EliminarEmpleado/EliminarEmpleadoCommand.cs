using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.EliminarEmpleado;

public record EliminarEmpleadoCommand(Guid Id) : ICommand<Result<bool>>;
