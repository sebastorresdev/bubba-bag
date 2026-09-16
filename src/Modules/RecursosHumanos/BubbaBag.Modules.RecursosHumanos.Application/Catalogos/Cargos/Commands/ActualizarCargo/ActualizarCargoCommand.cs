using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.ActualizarCargo;

public record ActualizarCargoCommand(
    Guid Id,
    string Nombre,
    Guid DepartamentoId,
    decimal? SalarioReferencial,
    bool Activo
) : ICommand<Result<Guid>>;
