using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CrearMotivoIncidencia;

public class CrearMotivoIncidenciaValidator : AbstractValidator<CrearMotivoIncidenciaCommand>
{
    public CrearMotivoIncidenciaValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código del motivo es obligatorio.")
            .MaximumLength(30).WithMessage("El código no puede exceder los 30 caracteres.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del motivo es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre no puede exceder los 150 caracteres.");

        RuleFor(x => x.Ambito)
            .IsInEnum().WithMessage("El ámbito del motivo de incidencia es inválido.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(250).WithMessage("La descripción no puede exceder los 250 caracteres.");
    }
}
