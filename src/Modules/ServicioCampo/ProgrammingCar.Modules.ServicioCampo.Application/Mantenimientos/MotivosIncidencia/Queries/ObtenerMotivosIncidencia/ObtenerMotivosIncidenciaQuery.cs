using System.Collections.Generic;
using ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivosIncidencia;

public record ObtenerMotivosIncidenciaQuery(
    AmbitoMotivo? Ambito = null,
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<MotivoIncidenciaDto>>>;
