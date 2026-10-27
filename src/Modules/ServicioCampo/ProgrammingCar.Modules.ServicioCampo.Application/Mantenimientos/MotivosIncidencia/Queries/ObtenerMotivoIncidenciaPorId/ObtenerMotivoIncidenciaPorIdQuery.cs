using System;
using ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivoIncidenciaPorId;

public record ObtenerMotivoIncidenciaPorIdQuery(Guid Id) : IQuery<Result<MotivoIncidenciaDto>>;
