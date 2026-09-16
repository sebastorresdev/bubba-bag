using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Queries.ObtenerCatalogosRrhh;

public record ObtenerCatalogosRrhhQuery : IQuery<Result<CatalogosRrhhDto>>;
