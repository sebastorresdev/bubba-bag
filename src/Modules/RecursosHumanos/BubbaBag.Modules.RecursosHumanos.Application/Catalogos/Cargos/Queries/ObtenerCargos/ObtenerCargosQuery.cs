using System;
using System.Collections.Generic;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargos;

public record ObtenerCargosQuery(
    Guid? DepartamentoId = null,
    bool? SoloActivos = null,
    string? SearchTerm = null
) : IQuery<Result<List<CargoDetalleDto>>>;
