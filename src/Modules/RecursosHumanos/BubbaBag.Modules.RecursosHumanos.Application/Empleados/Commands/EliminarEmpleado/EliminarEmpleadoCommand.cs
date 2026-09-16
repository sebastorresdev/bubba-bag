using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Commands.EliminarEmpleado;

public record EliminarEmpleadoCommand(Guid Id) : ICommand<Result<bool>>;
