using System;
using ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTipoOrdenTrabajoPorId;

public record ObtenerTipoOrdenTrabajoPorIdQuery(Guid Id) : IQuery<Result<TipoOrdenTrabajoDto>>;
