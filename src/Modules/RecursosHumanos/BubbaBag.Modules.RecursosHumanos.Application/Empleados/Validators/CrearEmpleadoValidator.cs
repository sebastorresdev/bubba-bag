using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;
using FluentValidation;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Validators;

public class CrearEmpleadoValidator : AbstractValidator<CrearEmpleadoCommand>
{
    public CrearEmpleadoValidator()
    {
        RuleFor(x => x.Nombres)
            .NotEmpty().WithMessage("Los nombres son obligatorios.")
            .MaximumLength(100).WithMessage("Los nombres no pueden exceder los 100 caracteres.");

        RuleFor(x => x.Apellidos)
            .NotEmpty().WithMessage("Los apellidos son obligatorios.")
            .MaximumLength(100).WithMessage("Los apellidos no pueden exceder los 100 caracteres.");

        RuleFor(x => x.TipoDocumento)
            .NotEmpty().WithMessage("El tipo de documento es obligatorio.")
            .MaximumLength(50).WithMessage("El tipo de documento no puede exceder los 50 caracteres.");

        RuleFor(x => x.NumeroDocumento)
            .NotEmpty().WithMessage("El número de documento es obligatorio.")
            .MaximumLength(30).WithMessage("El número de documento no puede exceder los 30 caracteres.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email)).WithMessage("El correo electrónico no tiene un formato válido.")
            .MaximumLength(150).WithMessage("El correo electrónico no puede exceder los 150 caracteres.");

        RuleFor(x => x.Telefono)
            .MaximumLength(30).WithMessage("El teléfono no puede exceder los 30 caracteres.");

        RuleFor(x => x.Direccion)
            .MaximumLength(250).WithMessage("La dirección no puede exceder los 250 caracteres.");

        RuleFor(x => x.Cargo)
            .MaximumLength(100).WithMessage("El cargo no puede exceder los 100 caracteres.");

        RuleFor(x => x.Departamento)
            .MaximumLength(100).WithMessage("El departamento no puede exceder los 100 caracteres.");

        RuleFor(x => x.TipoContrato)
            .MaximumLength(50).WithMessage("El tipo de contrato no puede exceder los 50 caracteres.");

        RuleFor(x => x.SalarioBase)
            .GreaterThanOrEqualTo(0).When(x => x.SalarioBase.HasValue).WithMessage("El salario base no puede ser un valor negativo.");

        RuleFor(x => x.MonedaSalario)
            .MaximumLength(3).WithMessage("La moneda no puede tener más de 3 caracteres (ej: PEN, USD).");

        RuleFor(x => x.RegimenPensionario)
            .MaximumLength(50).WithMessage("El régimen pensionario no puede exceder los 50 caracteres.");

        RuleFor(x => x.Cuspp)
            .MaximumLength(20).WithMessage("El CUSPP no puede exceder los 20 caracteres.");

        RuleFor(x => x.EntidadFinanciera)
            .MaximumLength(100).WithMessage("La entidad financiera no puede exceder los 100 caracteres.");

        RuleFor(x => x.CuentaBancaria)
            .MaximumLength(50).WithMessage("La cuenta bancaria no puede exceder los 50 caracteres.");

        RuleFor(x => x.CuentaInterbancaria)
            .MaximumLength(50).WithMessage("La cuenta interbancaria no puede exceder los 50 caracteres.");
    }
}
