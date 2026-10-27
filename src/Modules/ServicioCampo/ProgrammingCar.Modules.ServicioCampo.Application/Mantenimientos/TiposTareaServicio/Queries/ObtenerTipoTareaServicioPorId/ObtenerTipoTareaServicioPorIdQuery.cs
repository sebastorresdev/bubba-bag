using System;
using ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTipoTareaServicioPorId;

public record ObtenerTipoTareaServicioPorIdQuery(Guid Id) : IQuery<Result<TipoTareaServicioDto>>;
