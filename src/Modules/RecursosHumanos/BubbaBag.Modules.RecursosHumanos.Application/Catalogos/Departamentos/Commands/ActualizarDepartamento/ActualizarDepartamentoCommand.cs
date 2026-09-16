using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.ActualizarDepartamento;

public record ActualizarDepartamentoCommand(
    Guid Id,
    string Nombre,
    string? Descripcion,
    bool Activo
) : ICommand<Result<Guid>>;
