using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CambiarEstadoCargo;

public record CambiarEstadoCargoCommand(Guid Id, bool Activo) : ICommand<Result<Guid>>;
