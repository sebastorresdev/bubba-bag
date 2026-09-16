using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.ActualizarDepartamento;

public class ActualizarDepartamentoValidator : AbstractValidator<ActualizarDepartamentoCommand>
{
    public ActualizarDepartamentoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del departamento es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del departamento es inválido.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del departamento es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre del departamento no puede exceder los 100 caracteres.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(250).WithMessage("La descripción no puede exceder los 250 caracteres.");
    }
}
