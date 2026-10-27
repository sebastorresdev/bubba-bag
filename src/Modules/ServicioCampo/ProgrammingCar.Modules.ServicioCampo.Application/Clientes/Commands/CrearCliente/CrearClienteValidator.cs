using FluentValidation;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Commands.CrearCliente;

public class CrearClienteValidator : AbstractValidator<CrearClienteCommand>
{
    public CrearClienteValidator()
    {
        RuleFor(x => x.DocumentoIdentidad)
            .NotEmpty().WithMessage("El número de documento es obligatorio.")
            .MaximumLength(20).WithMessage("El número de documento no puede exceder los 20 caracteres.");

        RuleFor(x => x.Nombres)
            .Must((cmd, nombres) => !string.IsNullOrWhiteSpace(nombres) || !string.IsNullOrWhiteSpace(cmd.RazonSocial))
            .WithMessage("El nombre de la cuenta es obligatorio.")
            .MaximumLength(200).WithMessage("El nombre de la cuenta no puede exceder los 200 caracteres.");

        RuleFor(x => x.UbigeoCodigo)
            .NotEmpty().WithMessage("El distrito / ubigeo es obligatorio.")
            .MaximumLength(10).WithMessage("El código de ubigeo no puede exceder los 10 caracteres.");

        RuleFor(x => x.TelefonoPrincipal)
            .NotEmpty().WithMessage("El teléfono principal es obligatorio.")
            .MaximumLength(30).WithMessage("El teléfono principal no puede exceder los 30 caracteres.");

        RuleFor(x => x.Direccion)
            .NotEmpty().WithMessage("La dirección es obligatoria.")
            .MaximumLength(300).WithMessage("La dirección no puede exceder los 300 caracteres.");

        When(x => !string.IsNullOrWhiteSpace(x.Email), () =>
        {
            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("El correo electrónico no tiene un formato válido.")
                .MaximumLength(150).WithMessage("El correo electrónico no puede exceder los 150 caracteres.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.TelefonoSecundario), () =>
        {
            RuleFor(x => x.TelefonoSecundario)
                .MaximumLength(30).WithMessage("El teléfono secundario no puede exceder los 30 caracteres.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.ReferenciaUbicacion), () =>
        {
            RuleFor(x => x.ReferenciaUbicacion)
                .MaximumLength(300).WithMessage("La referencia de ubicación no puede exceder los 300 caracteres.");
        });
    }
}
