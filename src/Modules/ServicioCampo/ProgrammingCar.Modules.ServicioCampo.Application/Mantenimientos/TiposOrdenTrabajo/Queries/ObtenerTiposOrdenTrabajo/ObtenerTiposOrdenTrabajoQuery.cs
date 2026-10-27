using System.Collections.Generic;
using ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTiposOrdenTrabajo;

public record ObtenerTiposOrdenTrabajoQuery(
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<TipoOrdenTrabajoDto>>>;
