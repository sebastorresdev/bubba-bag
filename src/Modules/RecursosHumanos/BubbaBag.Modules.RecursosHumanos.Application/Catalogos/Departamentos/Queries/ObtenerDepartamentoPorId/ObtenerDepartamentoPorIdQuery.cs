using System;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentoPorId;

public record ObtenerDepartamentoPorIdQuery(Guid Id) : IQuery<Result<DepartamentoDetalleDto>>;
