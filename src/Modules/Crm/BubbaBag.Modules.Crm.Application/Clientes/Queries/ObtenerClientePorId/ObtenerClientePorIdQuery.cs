using System;
using BubbaBag.Modules.Crm.Application.Clientes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.Crm.Application.Clientes.Queries.ObtenerClientePorId;

public record ObtenerClientePorIdQuery(Guid Id) : IQuery<Result<ClienteDetalleDto>>;
