using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CrearCargo;

public record CrearCargoCommand(
    string Nombre,
    Guid DepartamentoId,
    decimal? SalarioReferencial
) : ICommand<Result<Guid>>;
