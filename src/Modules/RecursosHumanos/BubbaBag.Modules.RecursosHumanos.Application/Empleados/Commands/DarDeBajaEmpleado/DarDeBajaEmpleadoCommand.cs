using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Commands.DarDeBajaEmpleado;

public record DarDeBajaEmpleadoCommand(
    Guid EmpleadoId,
    DateOnly FechaCese,
    string MotivoCese,
    string? ObservacionesCese
) : ICommand<Result<Guid>>;
