using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Commands.ReactivarEmpleado;

public class ReactivarEmpleadoValidator : AbstractValidator<ReactivarEmpleadoCommand>
{
    public ReactivarEmpleadoValidator()
    {
        RuleFor(x => x.EmpleadoId)
            .NotEmpty().WithMessage("El identificador del colaborador es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del colaborador es inválido.");
    }
}
