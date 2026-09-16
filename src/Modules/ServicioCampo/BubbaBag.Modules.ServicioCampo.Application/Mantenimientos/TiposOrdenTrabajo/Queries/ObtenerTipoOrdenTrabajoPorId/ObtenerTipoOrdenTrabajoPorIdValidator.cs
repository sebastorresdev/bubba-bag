using System;
using FluentValidation;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTipoOrdenTrabajoPorId;

public class ObtenerTipoOrdenTrabajoPorIdValidator : AbstractValidator<ObtenerTipoOrdenTrabajoPorIdQuery>
{
    public ObtenerTipoOrdenTrabajoPorIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El identificador del tipo de orden es obligatorio.")
            .NotEqual(Guid.Empty).WithMessage("El identificador del tipo de orden es inválido.");
    }
}
