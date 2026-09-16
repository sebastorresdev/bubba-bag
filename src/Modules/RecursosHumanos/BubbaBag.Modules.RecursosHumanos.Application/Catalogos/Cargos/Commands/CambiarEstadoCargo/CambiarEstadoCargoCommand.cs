using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CambiarEstadoCargo;

public record CambiarEstadoCargoCommand(Guid Id, bool Activo) : ICommand<Result<Guid>>;
