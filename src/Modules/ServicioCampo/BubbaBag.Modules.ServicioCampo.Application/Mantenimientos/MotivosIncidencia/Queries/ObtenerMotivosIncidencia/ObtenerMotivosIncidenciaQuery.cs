using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivosIncidencia;

public record ObtenerMotivosIncidenciaQuery(
    AmbitoMotivo? Ambito = null,
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<MotivoIncidenciaDto>>>;
