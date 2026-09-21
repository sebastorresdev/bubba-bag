using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivosIncidencia;

public class ObtenerMotivosIncidenciaHandler : IQueryHandler<ObtenerMotivosIncidenciaQuery, Result<List<MotivoIncidenciaDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerMotivosIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<MotivoIncidenciaDto>>> HandleAsync(ObtenerMotivosIncidenciaQuery request, CancellationToken cancellationToken)
    {
        var query = _context.MotivosIncidencia.AsNoTracking().AsQueryable();

        if (request.Ambito.HasValue)
            query = query.Where(m => m.Ambito == request.Ambito.Value);

        if (request.SoloActivos.HasValue)
            query = query.Where(m => m.Activo == request.SoloActivos.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(m => m.Codigo.ToLower().Contains(search) || m.Nombre.ToLower().Contains(search));
        }

        var lista = await query
            .OrderBy(m => m.Nombre)
            .Select(m => new MotivoIncidenciaDto(
                m.Id,
                m.Codigo,
                m.Nombre,
                m.Descripcion,
                m.Ambito,
                m.Activo))
            .ToListAsync(cancellationToken);

        return Result<List<MotivoIncidenciaDto>>.Success(lista);
    }
}
