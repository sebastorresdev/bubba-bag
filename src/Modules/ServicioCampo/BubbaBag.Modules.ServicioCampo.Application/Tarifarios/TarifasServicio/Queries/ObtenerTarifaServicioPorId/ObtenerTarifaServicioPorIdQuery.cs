using System;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Queries.ObtenerTarifaServicioPorId;

public record ObtenerTarifaServicioPorIdQuery(Guid Id) : IQuery<Result<TarifaServicioDto>>;
