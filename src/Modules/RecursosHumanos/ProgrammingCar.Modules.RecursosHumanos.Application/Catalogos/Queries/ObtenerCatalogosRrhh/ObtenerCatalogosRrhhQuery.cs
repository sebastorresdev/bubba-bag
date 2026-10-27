using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Queries.ObtenerCatalogosRrhh;

public record ObtenerCatalogosRrhhQuery : IQuery<Result<CatalogosRrhhDto>>;
