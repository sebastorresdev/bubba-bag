using System;
using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Queries.ObtenerTarifasServicio;

public record ObtenerTarifasServicioQuery(
    string? EmpresaContratante = null,
    string? Sucursal = null,
    bool? SoloActivos = null,
    string? Search = null,
    string? Tipificacion = null
) : IQuery<Result<List<TarifaServicioDto>>>;
