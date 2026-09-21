using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Queries.ObtenerServicios;

public class ObtenerServiciosHandler : IQueryHandler<ObtenerServiciosQuery, Result<List<ServicioItemDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerServiciosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ServicioItemDto>>> HandleAsync(ObtenerServiciosQuery request, CancellationToken cancellationToken = default)
    {
        var query = _context.Servicios
            .AsNoTracking()
            .Include(s => s.CatalogoServicio)
            .Include(s => s.Pasos)
            .Include(s => s.MaterialesTeoricos)
            .AsQueryable();

        if (request.CatalogoServicioId.HasValue)
        {
            query = query.Where(s => s.CatalogoServicioId == request.CatalogoServicioId.Value);
        }

        if (request.SoloActivos.HasValue)
        {
            query = query.Where(s => s.Activo == request.SoloActivos.Value);
        }

        var list = await query
            .OrderBy(s => s.Codigo)
            .Select(s => new ServicioItemDto(
                s.Id,
                s.Codigo,
                s.Nombre,
                s.CatalogoServicioId,
                s.CatalogoServicio.Nombre,
                s.DuracionEstimadaMinutos,
                s.CodigoExterno,
                s.PrecioBase,
                s.Pasos.Count,
                s.MaterialesTeoricos.Count,
                s.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<List<ServicioItemDto>>.Success(list);
    }
}
