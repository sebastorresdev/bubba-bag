using System;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Queries.ObtenerServicioPorId;

public record ObtenerServicioPorIdQuery(Guid Id) : IQuery<Result<ServicioDetalleDto?>>;
