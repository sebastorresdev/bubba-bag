using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTipoTareaServicioPorId;

public class ObtenerTipoTareaServicioPorIdValidator : AbstractValidator<ObtenerTipoTareaServicioPorIdQuery>
{
    public ObtenerTipoTareaServicioPorIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de tarea es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de tarea es inválido.");
    }
}
