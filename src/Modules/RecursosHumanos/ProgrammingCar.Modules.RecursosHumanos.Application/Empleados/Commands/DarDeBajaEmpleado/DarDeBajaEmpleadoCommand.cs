using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.DarDeBajaEmpleado;

public record DarDeBajaEmpleadoCommand(
    Guid EmpleadoId,
    DateOnly FechaCese,
    string MotivoCese,
    string? ObservacionesCese
) : ICommand<Result<Guid>>;
