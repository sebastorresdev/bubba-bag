using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.CrearTarifaServicio;

public class CrearTarifaServicioValidator : AbstractValidator<CrearTarifaServicioCommand>
{
    public CrearTarifaServicioValidator()
    {
        RuleFor(x => x.CodigoServicio)
            .NotEmpty().WithMessage("El código de servicio es obligatorio.")
            .MaximumLength(30).WithMessage("El código de servicio no puede exceder 30 caracteres.");

        RuleFor(x => x.DetalleServicio)
            .NotEmpty().WithMessage("El detalle del servicio es obligatorio.")
            .MaximumLength(200).WithMessage("El detalle no puede exceder 200 caracteres.");

        RuleFor(x => x.Tipificacion)
            .NotEmpty().WithMessage("La tipificación es obligatoria.")
            .MaximumLength(100).WithMessage("La tipificación no puede exceder 100 caracteres.");

        RuleFor(x => x.EmpresaContratante)
            .NotEmpty().WithMessage("La empresa contratante es obligatoria.")
            .MaximumLength(50).WithMessage("La empresa contratante no puede exceder 50 caracteres.");

        RuleFor(x => x.Puntos)
            .GreaterThanOrEqualTo(0).WithMessage("Los puntos no pueden ser negativos.");

        RuleFor(x => x.FijoBase)
            .GreaterThanOrEqualTo(0).WithMessage("El monto fijo base no puede ser negativo.");
    }
}
