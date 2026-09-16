using System.Collections.Generic;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentos;

public record ObtenerDepartamentosQuery(
    bool? SoloActivos = null,
    string? SearchTerm = null
) : IQuery<Result<List<DepartamentoDetalleDto>>>;
