using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CambiarEstadoDepartamento;

public class CambiarEstadoDepartamentoValidator : AbstractValidator<CambiarEstadoDepartamentoCommand>
{
    public CambiarEstadoDepartamentoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del departamento es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del departamento es inválido.");
    }
}
