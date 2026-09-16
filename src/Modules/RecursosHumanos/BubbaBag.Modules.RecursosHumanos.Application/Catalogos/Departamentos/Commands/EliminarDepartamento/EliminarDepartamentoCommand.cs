using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.EliminarDepartamento;

public record EliminarDepartamentoCommand(Guid Id) : ICommand<Result<Guid>>;
