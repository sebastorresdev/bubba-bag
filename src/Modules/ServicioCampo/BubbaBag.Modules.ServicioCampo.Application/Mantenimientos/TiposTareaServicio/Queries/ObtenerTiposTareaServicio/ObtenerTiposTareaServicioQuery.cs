using System;
using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTiposTareaServicio;

public record ObtenerTiposTareaServicioQuery(
    Guid? ClienteFacturacionId = null,
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<TipoTareaServicioDto>>>;
