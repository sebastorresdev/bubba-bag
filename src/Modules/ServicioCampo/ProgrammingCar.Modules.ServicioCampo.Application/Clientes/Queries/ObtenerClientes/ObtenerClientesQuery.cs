using System.Collections.Generic;
using ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Queries.ObtenerClientes;

public record ObtenerClientesQuery(
    string? Search = null,
    bool? SoloFacturacion = null,
    bool? SoloServicio = null,
    bool? SoloActivos = null
) : IQuery<Result<IReadOnlyList<ClienteListadoItemDto>>>;
