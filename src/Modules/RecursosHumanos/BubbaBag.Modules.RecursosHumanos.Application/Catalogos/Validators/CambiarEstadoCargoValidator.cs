using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Validators;

public class CambiarEstadoCargoValidator : AbstractValidator<CambiarEstadoCargoCommand>
{
    public CambiarEstadoCargoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del cargo es obligatorio.");
    }
}
