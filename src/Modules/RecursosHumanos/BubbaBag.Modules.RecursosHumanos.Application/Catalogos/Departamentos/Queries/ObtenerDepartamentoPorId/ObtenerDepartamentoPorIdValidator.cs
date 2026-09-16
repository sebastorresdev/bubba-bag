using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentoPorId;

public class ObtenerDepartamentoPorIdValidator : AbstractValidator<ObtenerDepartamentoPorIdQuery>
{
    public ObtenerDepartamentoPorIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del departamento es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del departamento es inválido.");
    }
}
