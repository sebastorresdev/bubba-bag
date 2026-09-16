using System;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargoPorId;

public record ObtenerCargoPorIdQuery(Guid Id) : IQuery<Result<CargoDetalleDto>>;
