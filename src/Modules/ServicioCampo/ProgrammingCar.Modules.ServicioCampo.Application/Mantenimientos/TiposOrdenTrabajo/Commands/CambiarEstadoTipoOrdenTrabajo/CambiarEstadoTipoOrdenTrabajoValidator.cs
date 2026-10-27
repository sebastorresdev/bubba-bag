using System;
using FluentValidation;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CambiarEstadoTipoOrdenTrabajo;

public class CambiarEstadoTipoOrdenTrabajoValidator : AbstractValidator<CambiarEstadoTipoOrdenTrabajoCommand>
{
    public CambiarEstadoTipoOrdenTrabajoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de orden es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de orden es inválido.");
    }
}
