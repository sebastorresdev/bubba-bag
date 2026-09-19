using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CrearTipoOrdenTrabajo;

public class CrearTipoOrdenTrabajoValidator : AbstractValidator<CrearTipoOrdenTrabajoCommand>
{
    public CrearTipoOrdenTrabajoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del tipo de orden es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder los 100 caracteres.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(250).WithMessage("La descripción no puede exceder los 250 caracteres.");

        RuleFor(x => x.ColorHex)
            .NotEmpty().WithMessage("El color es obligatorio.")
            .Matches("^#(?:[0-9a-fA-F]{3}){1,2}$").WithMessage("El color debe tener un formato hexadecimal válido (ej: #0f6cbd).");
    }
}
