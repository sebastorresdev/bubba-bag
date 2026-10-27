using System;
using FluentValidation;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.EliminarDepartamento;

public class EliminarDepartamentoValidator : AbstractValidator<EliminarDepartamentoCommand>
{
    public EliminarDepartamentoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del departamento es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del departamento es inválido.");
    }
}
