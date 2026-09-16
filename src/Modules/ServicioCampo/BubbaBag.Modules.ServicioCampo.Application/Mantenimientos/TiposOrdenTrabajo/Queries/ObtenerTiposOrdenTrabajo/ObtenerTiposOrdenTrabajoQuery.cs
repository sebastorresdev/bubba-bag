using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTiposOrdenTrabajo;

public record ObtenerTiposOrdenTrabajoQuery(
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<TipoOrdenTrabajoDto>>>;
