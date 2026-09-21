using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTiposOrdenTrabajo;

public class ObtenerTiposOrdenTrabajoHandler : IQueryHandler<ObtenerTiposOrdenTrabajoQuery, Result<List<TipoOrdenTrabajoDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTiposOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TipoOrdenTrabajoDto>>> HandleAsync(ObtenerTiposOrdenTrabajoQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TiposOrdenTrabajo.AsNoTracking().AsQueryable();

        if (request.SoloActivos.HasValue)
            query = query.Where(t => t.Activo == request.SoloActivos.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(t => t.Nombre.ToLower().Contains(search) || (t.Descripcion != null && t.Descripcion.ToLower().Contains(search)));
        }

        var lista = await query
            .OrderBy(t => t.Nombre)
            .Select(t => new TipoOrdenTrabajoDto(
                t.Id,
                t.Nombre,
                t.Descripcion,
                t.RequiereVisitaCampo,
                t.ExigeFirmaCliente,
                t.ExigeEvidenciasFotograficas,
                t.ColorHex,
                t.Activo))
            .ToListAsync(cancellationToken);

        return Result<List<TipoOrdenTrabajoDto>>.Success(lista);
    }
}
