using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargoPorId;

public class ObtenerCargoPorIdValidator : AbstractValidator<ObtenerCargoPorIdQuery>
{
    public ObtenerCargoPorIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del cargo es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del cargo es inválido.");
    }
}
