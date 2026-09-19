using System;
using FluentValidation;

namespace BubbaBag.Modules.Crm.Application.Clientes.Queries.ObtenerClientePorId;

public class ObtenerClientePorIdValidator : AbstractValidator<ObtenerClientePorIdQuery>
{
    public ObtenerClientePorIdValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El ID del cliente es obligatorio.");
    }
}
