using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CambiarEstadoDepartamento;

public record CambiarEstadoDepartamentoCommand(Guid Id, bool Activo) : ICommand<Result<Guid>>;
