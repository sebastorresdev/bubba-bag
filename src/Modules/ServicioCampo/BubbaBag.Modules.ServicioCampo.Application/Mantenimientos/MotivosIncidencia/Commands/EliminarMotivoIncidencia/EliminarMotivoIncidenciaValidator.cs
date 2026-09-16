using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.EliminarMotivoIncidencia;

public class EliminarMotivoIncidenciaValidator : AbstractValidator<EliminarMotivoIncidenciaCommand>
{
    public EliminarMotivoIncidenciaValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del motivo de incidencia es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del motivo de incidencia es inválido.");
    }
}
