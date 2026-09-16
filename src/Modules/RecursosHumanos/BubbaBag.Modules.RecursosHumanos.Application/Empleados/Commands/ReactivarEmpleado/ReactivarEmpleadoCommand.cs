using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Commands.ReactivarEmpleado;

public record ReactivarEmpleadoCommand(Guid EmpleadoId) : ICommand<Result<Guid>>;
