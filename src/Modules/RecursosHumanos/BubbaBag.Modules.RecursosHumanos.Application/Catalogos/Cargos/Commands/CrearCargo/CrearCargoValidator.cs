using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CrearCargo;

public class CrearCargoValidator : AbstractValidator<CrearCargoCommand>
{
    public CrearCargoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del cargo es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre del cargo no puede exceder los 100 caracteres.");

        RuleFor(x => x.DepartamentoId)
            .NotEmpty().WithMessage("El departamento es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del departamento es inválido.");

        RuleFor(x => x.SalarioReferencial)
            .GreaterThanOrEqualTo(0).When(x => x.SalarioReferencial.HasValue)
            .WithMessage("El salario referencial no puede ser negativo.");
    }
}
