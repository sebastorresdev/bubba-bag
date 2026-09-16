using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivoIncidenciaPorId;

public class ObtenerMotivoIncidenciaPorIdValidator : AbstractValidator<ObtenerMotivoIncidenciaPorIdQuery>
{
    public ObtenerMotivoIncidenciaPorIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del motivo de incidencia es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del motivo de incidencia es inválido.");
    }
}
