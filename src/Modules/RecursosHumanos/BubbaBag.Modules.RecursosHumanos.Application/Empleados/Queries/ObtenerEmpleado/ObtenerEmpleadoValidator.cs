using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Queries.ObtenerEmpleado;

public class ObtenerEmpleadoValidator : AbstractValidator<ObtenerEmpleadoQuery>
{
    public ObtenerEmpleadoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del colaborador es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del colaborador es inválido.");
    }
}
