using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.CrearTarifaServicio;

public record CrearTarifaServicioCommand(
    string CodigoServicio,
    string DetalleServicio,
    string Tipificacion = "GENERAL",
    Guid? TipoTareaServicioId = null,
    string EmpresaContratante = "DIRECTV",
    Guid? ClienteFacturacionId = null,
    string? Sucursal = null,
    int Puntos = 0,
    decimal FijoBase = 0,
    decimal FijoAdicional = 0,
    decimal VariableTotal = 0,
    decimal Indicador1_CycleTime = 0,
    decimal Indicador2_Agenda = 0,
    decimal Indicador3_Sin30 = 0,
    decimal VariableAdicionalTotal = 0,
    decimal Indicador1_Adicional = 0,
    decimal Indicador2_Adicional = 0,
    decimal Indicador3_Adicional = 0,
    decimal? MontoTotalTeorico = null,
    bool AplicaPago = true,
    bool AplicaGarantia = false
) : ICommand<Result<Guid>>;
