using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Validators;

public class EliminarEmpleadoValidator : AbstractValidator<EliminarEmpleadoCommand>
{
    public EliminarEmpleadoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del colaborador es obligatorio.");
    }
}
