using System;
using System.Collections.Generic;
using ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTiposTareaServicio;

public record ObtenerTiposTareaServicioQuery(
    Guid? ClienteFacturacionId = null,
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<TipoTareaServicioDto>>>;
