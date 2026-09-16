using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CrearDepartamento;

public class CrearDepartamentoValidator : AbstractValidator<CrearDepartamentoCommand>
{
    public CrearDepartamentoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del departamento es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre del departamento no puede exceder los 100 caracteres.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(250).WithMessage("La descripción no puede exceder los 250 caracteres.");
    }
}
