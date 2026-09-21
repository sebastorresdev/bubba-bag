using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Queries.ObtenerCatalogosServicio;

public record ObtenerCatalogosServicioQuery(
    string? Search = null,
    Guid? ClienteId = null,
    bool? SoloActivos = true
) : IQuery<Result<List<CatalogoServicioDto>>>;

public class ObtenerCatalogosServicioHandler : IQueryHandler<ObtenerCatalogosServicioQuery, Result<List<CatalogoServicioDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerCatalogosServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<CatalogoServicioDto>>> HandleAsync(ObtenerCatalogosServicioQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.CatalogosServicio
            .AsNoTracking()
            .Include(c => c.Cliente)
            .Include(c => c.Servicios)
            .AsQueryable();

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(c => c.Activo == query.SoloActivos.Value);
        }

        if (query.ClienteId.HasValue)
        {
            dbQuery = dbQuery.Where(c => c.ClienteId == query.ClienteId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(c =>
                c.Nombre.ToLower().Contains(search) ||
                (c.Descripcion != null && c.Descripcion.ToLower().Contains(search)));
        }

        var list = await dbQuery
            .OrderBy(c => c.Nombre)
            .Select(c => new CatalogoServicioDto(
                c.Id,
                c.Nombre,
                c.Descripcion,
                c.ClienteId,
                c.Cliente != null ? c.Cliente.RazonSocial ?? c.Cliente.Nombres + " " + c.Cliente.Apellidos : null,
                c.Servicios.Count(),
                c.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<List<CatalogoServicioDto>>.Success(list);
    }
}
