using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.Ubigeos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Ubigeos.Queries.ObtenerUbigeos;

public record ObtenerUbigeosQuery(
    string? Departamento = null,
    string? Provincia = null,
    string? Search = null
) : IQuery<Result<IReadOnlyList<UbigeoDto>>>;
