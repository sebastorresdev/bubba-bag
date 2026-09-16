using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CambiarEstadoMotivoIncidencia;

public class CambiarEstadoMotivoIncidenciaValidator : AbstractValidator<CambiarEstadoMotivoIncidenciaCommand>
{
    public CambiarEstadoMotivoIncidenciaValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del motivo de incidencia es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del motivo de incidencia es inválido.");
    }
}
