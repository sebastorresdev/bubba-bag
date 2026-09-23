using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenes;

public record ObtenerAlmacenesQuery(
    TipoAlmacen? Tipo = null,
    Guid? SucursalId = null,
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

        if (query.Tipo.HasValue)
            dbQuery = dbQuery.Where(a => a.Tipo == query.Tipo.Value);

        if (query.SucursalId.HasValue)
            dbQuery = dbQuery.Where(a => a.SucursalId == query.SucursalId.Value);

        var lista = await dbQuery
            .OrderBy(a => a.Tipo)
            .ThenBy(a => a.Nombre)
            .Select(a => new AlmacenDto(
                a.Id,
                a.Codigo,
                a.Nombre,
                a.Tipo,
                a.Direccion,
                a.Telefono,
                a.SucursalId,
                a.RecursoTecnicoId,
                a.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<List<AlmacenDto>>.Success(lista);
    }
}
