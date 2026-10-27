using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.EliminarDepartamento;

public record EliminarDepartamentoCommand(Guid Id) : ICommand<Result<Guid>>;
