using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Validators;

public class ReactivarEmpleadoValidator : AbstractValidator<ReactivarEmpleadoCommand>
{
    public ReactivarEmpleadoValidator()
    {
        RuleFor(x => x.EmpleadoId)
            .NotEmpty().WithMessage("El identificador del colaborador es obligatorio.");
    }
}
