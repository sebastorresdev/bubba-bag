using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.ReactivarEmpleado;

public record ReactivarEmpleadoCommand(Guid EmpleadoId) : ICommand<Result<Guid>>;
