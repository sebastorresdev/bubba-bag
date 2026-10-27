using System;
using FluentValidation;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTipoOrdenTrabajoPorId;

public class ObtenerTipoOrdenTrabajoPorIdValidator : AbstractValidator<ObtenerTipoOrdenTrabajoPorIdQuery>
{
    public ObtenerTipoOrdenTrabajoPorIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de orden es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de orden es inválido.");
    }
}
