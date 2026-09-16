using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.ActualizarMotivoIncidencia;

public class ActualizarMotivoIncidenciaValidator : AbstractValidator<ActualizarMotivoIncidenciaCommand>
{
    public ActualizarMotivoIncidenciaValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del motivo de incidencia es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del motivo de incidencia es inválido.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del motivo es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre no puede exceder los 150 caracteres.");

        RuleFor(x => x.Ambito)
            .IsInEnum().WithMessage("El ámbito del motivo de incidencia es inválido.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(250).WithMessage("La descripción no puede exceder los 250 caracteres.");
    }
}
