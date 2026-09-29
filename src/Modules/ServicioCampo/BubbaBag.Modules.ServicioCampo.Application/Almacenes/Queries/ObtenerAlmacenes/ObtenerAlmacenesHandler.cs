using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenes;

public record ObtenerAlmacenesQuery(
    bool? SoloActivos = true
) : IQuery<Result<List<AlmacenDto>>>;

public class ObtenerAlmacenesHandler : IQueryHandler<ObtenerAlmacenesQuery, Result<List<AlmacenDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerAlmacenesHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AlmacenDto>>> HandleAsync(ObtenerAlmacenesQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Almacenes.AsNoTracking().AsQueryable();

        if (query.SoloActivos.HasValue)
            dbQuery = dbQuery.Where(a => a.Activo == query.SoloActivos.Value);

        var lista = await dbQuery
            .OrderBy(a => a.Nombre)
            .Select(a => new AlmacenDto(
                a.Id,
                a.Nombre,
                a.Descripcion,
                a.Activo,
                a.CreadoPorId,
                a.CreadoPorNombre,
                a.CreatedAt,
                a.ActualizadoPorId,
                a.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result<List<AlmacenDto>>.Success(lista);
    }
}
