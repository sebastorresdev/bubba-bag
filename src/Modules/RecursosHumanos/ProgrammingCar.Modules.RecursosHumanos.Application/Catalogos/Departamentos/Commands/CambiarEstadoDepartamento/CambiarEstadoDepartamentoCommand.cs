using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CambiarEstadoDepartamento;

public record CambiarEstadoDepartamentoCommand(Guid Id, bool Activo) : ICommand<Result<Guid>>;
