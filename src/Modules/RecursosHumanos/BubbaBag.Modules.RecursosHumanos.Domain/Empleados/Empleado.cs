using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Empleados;

public class Empleado : Entity<Guid>
{
    // Datos Obligatorios (Básicos para crear el registro)
    public string Nombres { get; private set; } = default!;
    public string Apellidos { get; private set; } = default!;
    public string TipoDocumento { get; private set; } = default!;
    public string NumeroDocumento { get; private set; } = default!;
    public EstadoEmpleado Estado { get; private set; } = EstadoEmpleado.Activo;

    // Datos Personales y Contacto (Opcionales)
    public string? Email { get; private set; }
    public string? Telefono { get; private set; }
    public DateOnly? FechaNacimiento { get; private set; }
    public string? Direccion { get; private set; }

    // Datos Laborales y Organizacionales (Opcionales)
    public DateOnly? FechaIngreso { get; private set; }
    public Guid? DepartamentoId { get; private set; }
    public Departamento? Departamento { get; private set; }
    public Guid? CargoId { get; private set; }
    public Cargo? Cargo { get; private set; }
    public string? TipoContrato { get; private set; }
    
    // Datos de Cese / Baja (Solo cuando Estado == Cesado)
    public DateOnly? FechaCese { get; private set; }
    public string? MotivoCese { get; private set; }
    public string? ObservacionesCese { get; private set; }

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
        Nombres = nombres.Trim();
        Apellidos = apellidos.Trim();
        TipoDocumento = tipoDocumento.Trim();
        NumeroDocumento = numeroDocumento.Trim();
        Estado = EstadoEmpleado.Activo;
    }

    public static Empleado Registrar(string nombres, string apellidos, string tipoDocumento, string numeroDocumento)
    {
        return new Empleado(Guid.NewGuid(), nombres, apellidos, tipoDocumento, numeroDocumento);
    }

    public void ActualizarDatosBasicos(string nombres, string apellidos, string tipoDocumento, string numeroDocumento)
    {
        Nombres = nombres.Trim();
        Apellidos = apellidos.Trim();
        TipoDocumento = tipoDocumento.Trim();
        NumeroDocumento = numeroDocumento.Trim();
    }

    public void ActualizarDatosContacto(string? email, string? telefono, string? direccion)
    {
        Email = email?.Trim();
        Telefono = telefono?.Trim();
        Direccion = direccion?.Trim();
    }

    public void ActualizarDatosLaborales(DateOnly? fechaIngreso, Guid? departamentoId, Guid? cargoId, string? tipoContrato)
    {
        FechaIngreso = fechaIngreso;
        DepartamentoId = departamentoId;
        CargoId = cargoId;
        TipoContrato = tipoContrato?.Trim();
    }

    public void ActualizarPlanilla(decimal? salarioBase, string? monedaSalario, bool tieneAsignacionFamiliar, string? regimenPensionario, string? cuspp)
    {
        SalarioBase = salarioBase;
        MonedaSalario = monedaSalario?.Trim();
        TieneAsignacionFamiliar = tieneAsignacionFamiliar;
        RegimenPensionario = regimenPensionario?.Trim();
        Cuspp = cuspp?.Trim();
    }

    public void ActualizarDatosBancarios(string? entidadFinanciera, string? cuentaBancaria, string? cuentaInterbancaria)
    {
        EntidadFinanciera = entidadFinanciera?.Trim();
        CuentaBancaria = cuentaBancaria?.Trim();
        CuentaInterbancaria = cuentaInterbancaria?.Trim();
    }

    public void CambiarEstado(EstadoEmpleado nuevoEstado)
    {
        Estado = nuevoEstado;
        if (nuevoEstado != EstadoEmpleado.Cesado)
        {
            FechaCese = null;
            MotivoCese = null;
            ObservacionesCese = null;
        }
    }

    public void DarDeBaja(DateOnly fechaCese, string motivoCese, string? observaciones = null)
    {
        Estado = EstadoEmpleado.Cesado;
        FechaCese = fechaCese;
        MotivoCese = motivoCese.Trim();
        ObservacionesCese = observaciones?.Trim();
    }

    public void Reactivar()
    {
        Estado = EstadoEmpleado.Activo;
        FechaCese = null;
        MotivoCese = null;
        ObservacionesCese = null;
    }
}
