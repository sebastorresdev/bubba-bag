using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.ActualizarTipoTareaServicio;

public class ActualizarTipoTareaServicioValidator : AbstractValidator<ActualizarTipoTareaServicioCommand>
{
    public ActualizarTipoTareaServicioValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de tarea es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de tarea es inválido.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de la tarea es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre de la tarea no puede exceder los 150 caracteres.");

        RuleFor(x => x.ClienteFacturacionId)
            .NotEmpty().WithMessage("El cliente contratante / facturable es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El cliente contratante / facturable especificado es inválido.");

        RuleFor(x => x.DuracionEstimadaMinutos)
            .GreaterThan(0).WithMessage("La duración estimada debe ser mayor a 0 minutos.")
            .LessThanOrEqualTo(1440).WithMessage("La duración estimada no puede exceder 1440 minutos (24 horas).");
    }
}
