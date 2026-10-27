using System;
using FluentValidation;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CambiarEstadoCargo;

public class CambiarEstadoCargoValidator : AbstractValidator<CambiarEstadoCargoCommand>
{
    public CambiarEstadoCargoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del cargo es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del cargo es inválido.");
    }
}
