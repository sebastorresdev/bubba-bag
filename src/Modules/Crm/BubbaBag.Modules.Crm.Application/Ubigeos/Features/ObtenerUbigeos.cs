using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Application.Ubigeos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Application.Ubigeos.Features;

public record ObtenerUbigeosQuery(
    string? Departamento = null,
    string? Provincia = null,
    string? Search = null
) : IQuery<Result<IReadOnlyList<UbigeoDto>>>;

public class ObtenerUbigeosHandler : IQueryHandler<ObtenerUbigeosQuery, Result<IReadOnlyList<UbigeoDto>>>
{
    private readonly ICrmDbContext _context;

    public ObtenerUbigeosHandler(ICrmDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IReadOnlyList<UbigeoDto>>> HandleAsync(ObtenerUbigeosQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Ubigeos.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Departamento))
        {
            var dep = request.Departamento.Trim().ToUpper();
            query = query.Where(u => u.Departamento == dep);
        }

        if (!string.IsNullOrWhiteSpace(request.Provincia))
        {
            var prov = request.Provincia.Trim().ToUpper();
            query = query.Where(u => u.Provincia == prov);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToUpper();
            query = query.Where(u =>
                u.Codigo.Contains(term) ||
                u.Distrito.Contains(term) ||
                u.Provincia.Contains(term) ||
                u.Departamento.Contains(term));
        }

        var list = await query
            .OrderBy(u => u.Departamento)
            .ThenBy(u => u.Provincia)
            .ThenBy(u => u.Distrito)
            .Select(u => new UbigeoDto(
                u.Codigo,
                u.Departamento,
                u.Provincia,
                u.Distrito,
                u.CapitalLegal,
                u.RegionNatural
            ))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<UbigeoDto>>.Success(list);
    }
}
