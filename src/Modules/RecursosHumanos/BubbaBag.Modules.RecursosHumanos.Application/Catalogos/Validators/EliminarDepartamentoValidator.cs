using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Departamentos;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Validators;

public class EliminarDepartamentoValidator : AbstractValidator<EliminarDepartamentoCommand>
{
    public EliminarDepartamentoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del departamento es obligatorio.");
    }
}
