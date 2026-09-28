using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerRecursosLookup;

public record RecursoLookupDto(
    Guid Id,
    string Codigo,
    string NombreCompleto,
    TipoRecurso Tipo,
    string? Telefono,
    bool Activo
);

public record ObtenerRecursosLookupQuery(
    TipoRecurso? Tipo = null,
    bool? SoloActivos = true
) : IQuery<Result<List<RecursoLookupDto>>>;

public class ObtenerRecursosLookupHandler : IQueryHandler<ObtenerRecursosLookupQuery, Result<List<RecursoLookupDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerRecursosLookupHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<RecursoLookupDto>>> HandleAsync(ObtenerRecursosLookupQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Recursos.AsNoTracking().AsQueryable();

        if (query.SoloActivos.HasValue)
            dbQuery = dbQuery.Where(r => r.Activo == query.SoloActivos.Value);

        if (query.Tipo.HasValue)
            dbQuery = dbQuery.Where(r => r.Tipo == query.Tipo.Value);

        var lista = await dbQuery
            .OrderBy(r => r.NombreCompleto)
            .Select(r => new RecursoLookupDto(
                r.Id,
                r.Codigo,
                r.NombreCompleto,
                r.Tipo,
                r.Telefono,
                r.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<List<RecursoLookupDto>>.Success(lista);
    }
}
