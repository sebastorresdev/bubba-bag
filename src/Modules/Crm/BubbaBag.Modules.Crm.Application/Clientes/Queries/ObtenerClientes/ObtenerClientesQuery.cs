using System.Collections.Generic;
using BubbaBag.Modules.Crm.Application.Clientes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.Crm.Application.Clientes.Queries.ObtenerClientes;

public record ObtenerClientesQuery(
    string? Search = null,
    bool? SoloFacturacion = null,
    bool? SoloServicio = null,
    bool? SoloActivos = null
) : IQuery<Result<IReadOnlyList<ClienteListadoItemDto>>>;
