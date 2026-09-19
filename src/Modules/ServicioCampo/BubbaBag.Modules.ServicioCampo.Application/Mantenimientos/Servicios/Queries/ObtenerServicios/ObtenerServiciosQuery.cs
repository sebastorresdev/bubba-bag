using System;
using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Queries.ObtenerServicios;

public record ObtenerServiciosQuery(
    Guid? CatalogoServicioId = null,
    bool? SoloActivos = true
) : IQuery<Result<List<ServicioItemDto>>>;
