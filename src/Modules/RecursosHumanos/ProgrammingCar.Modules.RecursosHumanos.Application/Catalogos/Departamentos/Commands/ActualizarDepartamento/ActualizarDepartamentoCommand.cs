using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.ActualizarDepartamento;

public record ActualizarDepartamentoCommand(
    Guid Id,
    string Nombre,
    string? Descripcion,
    bool Activo
) : ICommand<Result<Guid>>;
