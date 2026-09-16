using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CrearDepartamento;

public record CrearDepartamentoCommand(
    string Nombre,
    string? Descripcion
) : ICommand<Result<Guid>>;
