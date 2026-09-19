using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.ActualizarTarifaServicio;

public class ActualizarTarifaServicioValidator : AbstractValidator<ActualizarTarifaServicioCommand>
{
    public ActualizarTarifaServicioValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El ID de la tarifa es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El ID de la tarifa es inválido.");

        RuleFor(x => x.DetalleServicio)
            .NotEmpty().WithMessage("El detalle del servicio es obligatorio.")
            .MaximumLength(200).WithMessage("El detalle no puede exceder 200 caracteres.");

        RuleFor(x => x.Tipificacion)
            .NotEmpty().WithMessage("La tipificación es obligatoria.")
            .MaximumLength(100).WithMessage("La tipificación no puede exceder 100 caracteres.");

        RuleFor(x => x.Puntos)
            .GreaterThanOrEqualTo(0).WithMessage("Los puntos no pueden ser negativos.");

        RuleFor(x => x.FijoBase)
            .GreaterThanOrEqualTo(0).WithMessage("El monto fijo base no puede ser negativo.");
    }
}
