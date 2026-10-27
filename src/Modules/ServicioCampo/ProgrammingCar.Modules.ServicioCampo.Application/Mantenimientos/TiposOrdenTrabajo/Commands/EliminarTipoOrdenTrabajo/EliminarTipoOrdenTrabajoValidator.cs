using System;
using FluentValidation;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.EliminarTipoOrdenTrabajo;

public class EliminarTipoOrdenTrabajoValidator : AbstractValidator<EliminarTipoOrdenTrabajoCommand>
{
    public EliminarTipoOrdenTrabajoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de orden es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de orden es inválido.");
    }
}
