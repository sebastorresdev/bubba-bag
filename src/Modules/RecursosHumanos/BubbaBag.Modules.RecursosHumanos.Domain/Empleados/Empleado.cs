using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Empleados;

public class Empleado : Entity<Guid>
{
    // Datos Obligatorios (Básicos para crear el registro)
    public string Nombres { get; private set; } = default!;
    public string Apellidos { get; private set; } = default!;
    public string TipoDocumento { get; private set; } = default!;
    public string NumeroDocumento { get; private set; } = default!;
    public string Estado { get; private set; } = default!;

    // Datos Personales y Contacto (Opcionales)
    public string? Email { get; private set; }
    public string? Telefono { get; private set; }
    public DateOnly? FechaNacimiento { get; private set; }
    public string? Direccion { get; private set; }

    // Datos Laborales / Contractuales (Opcionales)
    public DateOnly? FechaIngreso { get; private set; }
    public string? Cargo { get; private set; }
    public string? Departamento { get; private set; }
    public string? TipoContrato { get; private set; }
    
    // Datos de Planilla y Remuneración (Opcionales)
    public decimal? SalarioBase { get; private set; }
    public string? MonedaSalario { get; private set; } // Ej: "PEN", "USD"
    public bool TieneAsignacionFamiliar { get; private set; }
    public string? RegimenPensionario { get; private set; } // Ej: "AFP Integra", "ONP"
    public string? Cuspp { get; private set; }

    // Datos Bancarios (Opcionales)
    public string? EntidadFinanciera { get; private set; }
    public string? CuentaBancaria { get; private set; }
    public string? CuentaInterbancaria { get; private set; }

    // Constructor privado para EF Core
    private Empleado() { }

    private Empleado(Guid id, string nombres, string apellidos, string tipoDocumento, string numeroDocumento)
    {
        Id = id;
        Nombres = nombres;
        Apellidos = apellidos;
        TipoDocumento = tipoDocumento;
        NumeroDocumento = numeroDocumento;
        Estado = "Activo"; // Estado por defecto al registrar
    }

    public static Empleado Registrar(string nombres, string apellidos, string tipoDocumento, string numeroDocumento)
    {
        return new Empleado(Guid.NewGuid(), nombres, apellidos, tipoDocumento, numeroDocumento);
    }

    public void ActualizarDatosBasicos(string nombres, string apellidos, string tipoDocumento, string numeroDocumento)
    {
        Nombres = nombres;
        Apellidos = apellidos;
        TipoDocumento = tipoDocumento;
        NumeroDocumento = numeroDocumento;
    }

    public void ActualizarDatosContacto(string? email, string? telefono, string? direccion)
    {
        Email = email;
        Telefono = telefono;
        Direccion = direccion;
    }

    public void ActualizarDatosLaborales(DateOnly? fechaIngreso, string? cargo, string? departamento, string? tipoContrato)
    {
        FechaIngreso = fechaIngreso;
        Cargo = cargo;
        Departamento = departamento;
        TipoContrato = tipoContrato;
    }

    public void ActualizarPlanilla(decimal? salarioBase, string? monedaSalario, bool tieneAsignacionFamiliar, string? regimenPensionario, string? cuspp)
    {
        SalarioBase = salarioBase;
        MonedaSalario = monedaSalario;
        TieneAsignacionFamiliar = tieneAsignacionFamiliar;
        RegimenPensionario = regimenPensionario;
        Cuspp = cuspp;
    }

    public void ActualizarDatosBancarios(string? entidadFinanciera, string? cuentaBancaria, string? cuentaInterbancaria)
    {
        EntidadFinanciera = entidadFinanciera;
        CuentaBancaria = cuentaBancaria;
        CuentaInterbancaria = cuentaInterbancaria;
    }

    public void CambiarEstado(string nuevoEstado)
    {
        Estado = nuevoEstado;
    }
}
