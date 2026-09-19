using System;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Queries.ObtenerCatalogoServicioPorId;

public record ObtenerCatalogoServicioPorIdQuery(Guid Id) : IQuery<Result<CatalogoServicioDto?>>;
