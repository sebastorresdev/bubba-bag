using System;
using ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Queries.ObtenerClientePorId;

public record ObtenerClientePorIdQuery(Guid Id) : IQuery<Result<ClienteDetalleDto>>;
