using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CrearTipoTareaServicio;

public class CrearTipoTareaServicioValidator : AbstractValidator<CrearTipoTareaServicioCommand>
{
    public CrearTipoTareaServicioValidator()
    {
        RuleFor(x => x.CodigoTarea)
            .NotEmpty().WithMessage("El código de la tarea es obligatorio.")
            .MaximumLength(30).WithMessage("El código de la tarea no puede exceder los 30 caracteres.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de la tarea es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre de la tarea no puede exceder los 150 caracteres.");

        When(x => x.ClienteFacturacionId.HasValue, () =>
        {
            RuleFor(x => x.ClienteFacturacionId!.Value)
                .NotEqual(Guid.Empty).WithMessage("El cliente contratante / facturable especificado es inválido.");
        });

        RuleFor(x => x.DuracionEstimadaMinutos)
            .GreaterThan(0).WithMessage("La duración estimada debe ser mayor a 0 minutos.")
            .LessThanOrEqualTo(1440).WithMessage("La duración estimada no puede exceder 1440 minutos (24 horas).");
    }
}
