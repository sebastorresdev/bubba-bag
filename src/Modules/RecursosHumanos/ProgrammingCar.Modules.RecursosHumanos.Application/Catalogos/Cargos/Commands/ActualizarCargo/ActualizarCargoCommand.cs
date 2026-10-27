using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.ActualizarCargo;

public record ActualizarCargoCommand(
    Guid Id,
    string Nombre,
    Guid DepartamentoId,
    decimal? SalarioReferencial,
    bool Activo
) : ICommand<Result<Guid>>;
