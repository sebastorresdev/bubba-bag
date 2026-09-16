using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.EliminarTipoTareaServicio;

public class EliminarTipoTareaServicioValidator : AbstractValidator<EliminarTipoTareaServicioCommand>
{
    public EliminarTipoTareaServicioValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de tarea es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de tarea es inválido.");
    }
}
