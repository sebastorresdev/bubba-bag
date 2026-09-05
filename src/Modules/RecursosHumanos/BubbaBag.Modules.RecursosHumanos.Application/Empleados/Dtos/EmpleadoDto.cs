using System;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;

public record EmpleadoDto(
    Guid Id,
    string Nombres,
    string Apellidos,
    string TipoDocumento,
    string NumeroDocumento,
    string Estado,
    string? Email,
    string? Telefono,
    DateOnly? FechaNacimiento,
    string? Direccion,
    DateOnly? FechaIngreso,
    string? Cargo,
    string? Departamento,
    string? TipoContrato,
    decimal? SalarioBase,
    string? MonedaSalario,
    bool TieneAsignacionFamiliar,
    string? RegimenPensionario,
    string? Cuspp,
    string? EntidadFinanciera,
    string? CuentaBancaria,
    string? CuentaInterbancaria
);

