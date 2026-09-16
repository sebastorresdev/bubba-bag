using System;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.EliminarCargo;

public class EliminarCargoValidator : AbstractValidator<EliminarCargoCommand>
{
    public EliminarCargoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del cargo es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del cargo es inválido.");
    }
}
