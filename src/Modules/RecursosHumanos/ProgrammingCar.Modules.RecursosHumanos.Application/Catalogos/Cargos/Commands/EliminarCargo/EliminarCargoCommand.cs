using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.EliminarCargo;

public record EliminarCargoCommand(Guid Id) : ICommand<Result<Guid>>;
