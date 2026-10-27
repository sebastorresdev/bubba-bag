using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CrearDepartamento;

public record CrearDepartamentoCommand(
    string Nombre,
    string? Descripcion
) : ICommand<Result<Guid>>;
