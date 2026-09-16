using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Commands.DarDeBajaEmpleado;

public class DarDeBajaEmpleadoValidator : AbstractValidator<DarDeBajaEmpleadoCommand>
{
    public DarDeBajaEmpleadoValidator()
    {
        RuleFor(x => x.EmpleadoId)
            .NotEmpty().WithMessage("El identificador del colaborador es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del colaborador es inválido.");

        RuleFor(x => x.FechaCese)
            .NotEmpty().WithMessage("La fecha de cese es obligatoria.");

        RuleFor(x => x.MotivoCese)
            .NotEmpty().WithMessage("El motivo de cese es obligatorio.")
            .MaximumLength(100).WithMessage("El motivo de cese no puede superar los 100 caracteres.");

        RuleFor(x => x.ObservacionesCese)
            .MaximumLength(500).WithMessage("Las observaciones de cese no pueden superar los 500 caracteres.");
    }
}
