using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;

namespace BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;

/// <summary>
/// Tarifa y Compensación Oficial de Servicio por Empresa Contratante (DIRECTV, Claro, Win, etc.).
/// Modela componentes fijos y variables (indicadores de calidad: Cycle Time, Cumplimiento de Agenda, SIN 30).
/// </summary>
public class TarifaServicio : Entity<Guid>
{
    public Guid? ClienteFacturacionId { get; private set; }
    public Cliente? ClienteFacturacion { get; private set; }

    public Guid? TipoTareaServicioId { get; private set; }
    public TipoTareaServicio? TipoTareaServicio { get; private set; }

    public string Tipificacion { get; private set; } = "GENERAL";      // "INSTALACION", "SERVICIOS TECNICOS", "SERVICIOS DE INSTALACION", "MUDANZA", etc.
    public string EmpresaContratante { get; private set; } = "DIRECTV"; // DIRECTV, CLARO, etc.
    public string CodigoServicio { get; private set; } = default!;     // "IB01", "IA01", "IC01", etc.
    public string DetalleServicio { get; private set; } = default!;    // "Instalación Básica Casa"
    public string? Sucursal { get; private set; }                      // "CHICLAYO", "PIURA", o null para tarifa nacional

    public int Puntos { get; private set; }                            // 4, 1, 2, 0...

    // =========================================================================
    // COMPONENTE FIJO
    // =========================================================================
    public decimal FijoBase { get; private set; }                      // S/. 80.00
    public decimal FijoAdicional { get; private set; }                 // S/. 0.00 o S/. 10.00
    public decimal TotalFijo => FijoBase + FijoAdicional;

    // =========================================================================
    // COMPONENTE VARIABLE PRINCIPAL (Indicadores de Calidad)
    // =========================================================================
    public decimal VariableTotal { get; private set; }                 // S/. 30.00
    public decimal Indicador1_CycleTime { get; private set; }          // S/. 9.00
    public decimal Indicador2_Agenda { get; private set; }             // S/. 12.00
    public decimal Indicador3_Sin30 { get; private set; }              // S/. 9.00

    // =========================================================================
    // COMPONENTE VARIABLE ADICIONAL
    // =========================================================================
    public decimal VariableAdicionalTotal { get; private set; }        // S/. 5.00
    public decimal Indicador1_Adicional { get; private set; }          // S/. 1.50
    public decimal Indicador2_Adicional { get; private set; }          // S/. 2.00
    public decimal Indicador3_Adicional { get; private set; }          // S/. 1.50

    // =========================================================================
    // TOTALES Y REGLAS CONTRACTUALES
    // =========================================================================
    public decimal MontoTotalTeorico { get; private set; }             // S/. 115.00
    public bool AplicaPago { get; private set; } = true;
    public bool AplicaGarantia { get; private set; } = false;
    public bool Activo { get; private set; } = true;

    private TarifaServicio() { }

    public static TarifaServicio Crear(
        string codigoServicio,
        string detalleServicio,
        string tipificacion = "GENERAL",
        Guid? tipoTareaServicioId = null,
        string empresaContratante = "DIRECTV",
        Guid? clienteFacturacionId = null,
        string? sucursal = null,
        int puntos = 0,
        decimal fijoBase = 0,
        decimal fijoAdicional = 0,
        decimal variableTotal = 0,
        decimal cycleTime = 0,
        decimal agenda = 0,
        decimal sin30 = 0,
        decimal variableAdicionalTotal = 0,
        decimal cycleTimeAdic = 0,
        decimal agendaAdic = 0,
        decimal sin30Adic = 0,
        decimal? montoTotal = null,
        bool aplicaPago = true,
        bool aplicaGarantia = false)
    {
        var codigoNorm = string.IsNullOrWhiteSpace(codigoServicio)
            ? throw new ArgumentException("El código de servicio es obligatorio.", nameof(codigoServicio))
            : codigoServicio.Trim().ToUpperInvariant();

        decimal totalCalculado = montoTotal ?? (fijoBase + fijoAdicional + variableTotal + variableAdicionalTotal);

        return new TarifaServicio
        {
            Id = Guid.NewGuid(),
            CodigoServicio = codigoNorm,
            DetalleServicio = detalleServicio?.Trim() ?? codigoNorm,
            Tipificacion = string.IsNullOrWhiteSpace(tipificacion) ? "GENERAL" : tipificacion.Trim().ToUpperInvariant(),
            TipoTareaServicioId = tipoTareaServicioId,
            EmpresaContratante = string.IsNullOrWhiteSpace(empresaContratante) ? "DIRECTV" : empresaContratante.Trim().ToUpperInvariant(),
            ClienteFacturacionId = clienteFacturacionId,
            Sucursal = string.IsNullOrWhiteSpace(sucursal) ? null : sucursal.Trim().ToUpperInvariant(),
            Puntos = puntos,
            FijoBase = fijoBase,
            FijoAdicional = fijoAdicional,
            VariableTotal = variableTotal,
            Indicador1_CycleTime = cycleTime,
            Indicador2_Agenda = agenda,
            Indicador3_Sin30 = sin30,
            VariableAdicionalTotal = variableAdicionalTotal,
            Indicador1_Adicional = cycleTimeAdic,
            Indicador2_Adicional = agendaAdic,
            Indicador3_Adicional = sin30Adic,
            MontoTotalTeorico = totalCalculado,
            AplicaPago = aplicaPago,
            AplicaGarantia = aplicaGarantia,
            Activo = true
        };
    }

    public void Actualizar(
        string detalleServicio,
        string tipificacion,
        Guid? tipoTareaServicioId,
        string empresaContratante,
        Guid? clienteFacturacionId,
        string? sucursal,
        int puntos,
        decimal fijoBase,
        decimal fijoAdicional,
        decimal variableTotal,
        decimal cycleTime,
        decimal agenda,
        decimal sin30,
        decimal variableAdicionalTotal,
        decimal cycleTimeAdic,
        decimal agendaAdic,
        decimal sin30Adic,
        decimal? montoTotal,
        bool aplicaPago,
        bool aplicaGarantia)
    {
        DetalleServicio = detalleServicio.Trim();
        Tipificacion = string.IsNullOrWhiteSpace(tipificacion) ? "GENERAL" : tipificacion.Trim().ToUpperInvariant();
        TipoTareaServicioId = tipoTareaServicioId;
        EmpresaContratante = string.IsNullOrWhiteSpace(empresaContratante) ? "DIRECTV" : empresaContratante.Trim().ToUpperInvariant();
        ClienteFacturacionId = clienteFacturacionId;
        Sucursal = string.IsNullOrWhiteSpace(sucursal) ? null : sucursal.Trim().ToUpperInvariant();
        Puntos = puntos;
        FijoBase = fijoBase;
        FijoAdicional = fijoAdicional;
        VariableTotal = variableTotal;
        Indicador1_CycleTime = cycleTime;
        Indicador2_Agenda = agenda;
        Indicador3_Sin30 = sin30;
        VariableAdicionalTotal = variableAdicionalTotal;
        Indicador1_Adicional = cycleTimeAdic;
        Indicador2_Adicional = agendaAdic;
        Indicador3_Adicional = sin30Adic;
        MontoTotalTeorico = montoTotal ?? (fijoBase + fijoAdicional + variableTotal + variableAdicionalTotal);
        AplicaPago = aplicaPago;
        AplicaGarantia = aplicaGarantia;
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
