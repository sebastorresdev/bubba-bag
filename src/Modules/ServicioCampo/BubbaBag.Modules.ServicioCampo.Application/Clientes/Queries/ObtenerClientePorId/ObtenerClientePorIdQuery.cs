using System;
using BubbaBag.Modules.ServicioCampo.Application.Clientes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Clientes.Queries.ObtenerClientePorId;

public record ObtenerClientePorIdQuery(Guid Id) : IQuery<Result<ClienteDetalleDto>>;
