using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.EliminarCargo;

public record EliminarCargoCommand(Guid Id) : ICommand<Result<Guid>>;
