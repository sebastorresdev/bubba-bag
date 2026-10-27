using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CrearCargo;

public record CrearCargoCommand(
    string Nombre,
    Guid DepartamentoId,
    decimal? SalarioReferencial
) : ICommand<Result<Guid>>;
