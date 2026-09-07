using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Validators;

public class ActualizarCargoValidator : AbstractValidator<ActualizarCargoCommand>
{
    public ActualizarCargoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del cargo es obligatorio.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del cargo es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre del cargo no puede exceder los 100 caracteres.");

        RuleFor(x => x.DepartamentoId)
            .NotEmpty().WithMessage("El departamento es obligatorio.");

        RuleFor(x => x.SalarioReferencial)
            .GreaterThanOrEqualTo(0).When(x => x.SalarioReferencial.HasValue)
            .WithMessage("El salario referencial no puede ser negativo.");
    }
}
