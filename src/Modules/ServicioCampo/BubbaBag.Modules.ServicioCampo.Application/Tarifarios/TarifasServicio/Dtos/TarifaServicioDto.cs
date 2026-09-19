using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Dtos;

public record TarifaServicioDto(
    Guid Id,
    string Tipificacion,
    string EmpresaContratante,
    Guid? ClienteFacturacionId,
    string? ClienteFacturacionNombre,
    Guid? TipoTareaServicioId,
    string? TipoTareaServicioCodigo,
    string? TipoTareaServicioNombre,
    string CodigoServicio,
    string DetalleServicio,
    string? Sucursal,
    int Puntos,
    decimal FijoBase,
    decimal FijoAdicional,
    decimal TotalFijo,
    decimal VariableTotal,
    decimal Indicador1_CycleTime,
    decimal Indicador2_Agenda,
    decimal Indicador3_Sin30,
    decimal VariableAdicionalTotal,
    decimal Indicador1_Adicional,
    decimal Indicador2_Adicional,
    decimal Indicador3_Adicional,
    decimal MontoTotalTeorico,
    bool AplicaPago,
    bool AplicaGarantia,
    bool Activo)
{
    public decimal CycleTime => Indicador1_CycleTime;
    public decimal CumplimientoAgenda => Indicador2_Agenda;
    public decimal Sin30Dias => Indicador3_Sin30;
    public decimal CycleTimeAdicional => Indicador1_Adicional;
    public decimal CumplimientoAgendaAdicional => Indicador2_Adicional;
    public decimal Sin30DiasAdicional => Indicador3_Adicional;
}
