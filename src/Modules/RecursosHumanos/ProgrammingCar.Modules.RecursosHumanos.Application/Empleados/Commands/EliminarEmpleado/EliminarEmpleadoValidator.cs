using System;
using FluentValidation;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.EliminarEmpleado;

public class EliminarEmpleadoValidator : AbstractValidator<EliminarEmpleadoCommand>
{
    public EliminarEmpleadoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del colaborador es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del colaborador es inválido.");
    }
}
