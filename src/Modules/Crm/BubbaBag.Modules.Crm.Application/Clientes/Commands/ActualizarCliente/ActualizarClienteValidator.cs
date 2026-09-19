using System;
using FluentValidation;

namespace BubbaBag.Modules.Crm.Application.Clientes.Commands.ActualizarCliente;

public class ActualizarClienteValidator : AbstractValidator<ActualizarClienteCommand>
{
    public ActualizarClienteValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El ID del cliente es obligatorio.");

        RuleFor(x => x.TelefonoPrincipal)
            .NotEmpty().WithMessage("El teléfono principal es obligatorio.")
            .MaximumLength(20).WithMessage("El teléfono principal no puede exceder los 20 caracteres.");

        RuleFor(x => x.Direccion)
            .NotEmpty().WithMessage("La dirección es obligatoria.")
            .MaximumLength(300).WithMessage("La dirección no puede exceder los 300 caracteres.");

        RuleFor(x => x.UbigeoCodigo)
            .NotEmpty().WithMessage("El código de ubigeo es obligatorio.")
            .MaximumLength(6).WithMessage("El código de ubigeo no puede exceder los 6 caracteres.");

        When(x => !string.IsNullOrWhiteSpace(x.ReferenciaUbicacion), () =>
        {
            RuleFor(x => x.ReferenciaUbicacion)
                .MaximumLength(300).WithMessage("La referencia de ubicación no puede exceder los 300 caracteres.");
        });
    }
}
