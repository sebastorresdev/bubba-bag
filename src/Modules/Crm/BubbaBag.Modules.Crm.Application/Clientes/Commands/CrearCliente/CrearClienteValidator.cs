using System;
using FluentValidation;

namespace BubbaBag.Modules.Crm.Application.Clientes.Commands.CrearCliente;

public class CrearClienteValidator : AbstractValidator<CrearClienteCommand>
{
    public CrearClienteValidator()
    {
        RuleFor(x => x.DocumentoIdentidad)
            .NotEmpty().WithMessage("El número de documento de identidad es obligatorio.")
            .MaximumLength(20).WithMessage("El documento de identidad no puede exceder los 20 caracteres.");

        RuleFor(x => x.UbigeoCodigo)
            .NotEmpty().WithMessage("El código de ubigeo es obligatorio.")
            .MaximumLength(6).WithMessage("El código de ubigeo no puede exceder los 6 caracteres.");

        RuleFor(x => x.TelefonoPrincipal)
            .NotEmpty().WithMessage("El teléfono principal es obligatorio.")
            .MaximumLength(20).WithMessage("El teléfono principal no puede exceder los 20 caracteres.");

        RuleFor(x => x.Direccion)
            .NotEmpty().WithMessage("La dirección es obligatoria.")
            .MaximumLength(300).WithMessage("La dirección no puede exceder los 300 caracteres.");

        RuleFor(x => x.TipoPersona)
            .NotEmpty().WithMessage("El tipo de persona es obligatorio.")
            .Must(tp => string.Equals(tp, "NATURAL", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(tp, "JURIDICA", StringComparison.OrdinalIgnoreCase))
            .WithMessage("El tipo de persona debe ser 'NATURAL' o 'JURIDICA'.");

        When(x => string.Equals(x.TipoPersona, "JURIDICA", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(x => x.RazonSocial)
                .NotEmpty().WithMessage("Para personas jurídicas, la razón social es obligatoria.")
                .MaximumLength(250).WithMessage("La razón social no puede exceder los 250 caracteres.");
        });

        When(x => !string.Equals(x.TipoPersona, "JURIDICA", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(x => x.Nombres)
                .NotEmpty().WithMessage("Los nombres son obligatorios para personas naturales.")
                .MaximumLength(150).WithMessage("Los nombres no pueden exceder los 150 caracteres.");

            RuleFor(x => x.Apellidos)
                .NotEmpty().WithMessage("Los apellidos son obligatorios para personas naturales.")
                .MaximumLength(150).WithMessage("Los apellidos no pueden exceder los 150 caracteres.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.Email), () =>
        {
            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("El correo electrónico no tiene un formato válido.")
                .MaximumLength(150).WithMessage("El correo electrónico no puede exceder los 150 caracteres.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.TelefonoSecundario), () =>
        {
            RuleFor(x => x.TelefonoSecundario)
                .MaximumLength(20).WithMessage("El teléfono secundario no puede exceder los 20 caracteres.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.ReferenciaUbicacion), () =>
        {
            RuleFor(x => x.ReferenciaUbicacion)
                .MaximumLength(300).WithMessage("La referencia de ubicación no puede exceder los 300 caracteres.");
        });
    }
}
