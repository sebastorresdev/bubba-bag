using System;
using FluentValidation;

namespace BubbaBag.Modules.Crm.Application.Clientes.Commands.CambiarEstadoCliente;

public class CambiarEstadoClienteValidator : AbstractValidator<CambiarEstadoClienteCommand>
{
    public CambiarEstadoClienteValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El ID del cliente es obligatorio.");
    }
}
