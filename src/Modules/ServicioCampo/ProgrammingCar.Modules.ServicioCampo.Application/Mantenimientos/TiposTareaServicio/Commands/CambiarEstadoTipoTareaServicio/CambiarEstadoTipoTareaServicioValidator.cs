using System;
using FluentValidation;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CambiarEstadoTipoTareaServicio;

public class CambiarEstadoTipoTareaServicioValidator : AbstractValidator<CambiarEstadoTipoTareaServicioCommand>
{
    public CambiarEstadoTipoTareaServicioValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de tarea es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de tarea es inválido.");
    }
}
