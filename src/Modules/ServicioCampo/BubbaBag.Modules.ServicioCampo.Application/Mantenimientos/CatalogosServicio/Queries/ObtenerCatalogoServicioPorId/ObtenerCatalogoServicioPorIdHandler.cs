using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Queries.ObtenerCatalogoServicioPorId;

public class ObtenerCatalogoServicioPorIdHandler : IQueryHandler<ObtenerCatalogoServicioPorIdQuery, Result<CatalogoServicioDto?>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerCatalogoServicioPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CatalogoServicioDto?>> HandleAsync(ObtenerCatalogoServicioPorIdQuery request, CancellationToken cancellationToken = default)
    {
        var catalogo = await _context.CatalogosServicio
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CatalogoServicioDto(
                c.Id,
                c.Nombre,
                c.Descripcion,
                c.ClienteId,
                c.Cliente != null ? c.Cliente.RazonSocial ?? c.Cliente.Nombres + " " + c.Cliente.Apellidos : null,
                c.Servicios.Count,
                c.Activo
            ))
            .FirstOrDefaultAsync(cancellationToken);

        return Result<CatalogoServicioDto?>.Success(catalogo);
    }
}
