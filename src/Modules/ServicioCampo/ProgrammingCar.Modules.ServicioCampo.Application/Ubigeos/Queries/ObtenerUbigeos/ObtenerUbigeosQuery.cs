using System.Collections.Generic;
using ProgrammingCar.Modules.ServicioCampo.Application.Ubigeos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Ubigeos.Queries.ObtenerUbigeos;

public record ObtenerUbigeosQuery(
    string? Departamento = null,
    string? Provincia = null,
    string? Search = null
) : IQuery<Result<IReadOnlyList<UbigeoDto>>>;
