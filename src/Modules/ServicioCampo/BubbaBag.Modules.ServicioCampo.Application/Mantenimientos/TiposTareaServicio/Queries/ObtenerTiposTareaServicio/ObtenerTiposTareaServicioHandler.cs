using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTiposTareaServicio;

public class ObtenerTiposTareaServicioHandler : IQueryHandler<ObtenerTiposTareaServicioQuery, Result<List<TipoTareaServicioDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTiposTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TipoTareaServicioDto>>> HandleAsync(ObtenerTiposTareaServicioQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TiposTareaServicio.AsNoTracking().Include(t => t.ClienteFacturacion).AsQueryable();

        if (request.ClienteFacturacionId.HasValue && request.ClienteFacturacionId.Value != Guid.Empty)
        {
            query = query.Where(t => t.ClienteFacturacionId == request.ClienteFacturacionId.Value);
        }

        if (request.SoloActivos == true)
            query = query.Where(t => t.Activo);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(t => t.CodigoTarea.ToLower().Contains(search) || t.Nombre.ToLower().Contains(search));
        }

        var tareas = await query
            .OrderBy(t => t.CodigoTarea)
            .ToListAsync(cancellationToken);

        var lista = tareas
            .Select(t => new TipoTareaServicioDto(
                t.Id,
                t.CodigoTarea,
                t.Nombre,
                t.ClienteFacturacionId,
                t.ClienteFacturacion != null
                    ? (!string.IsNullOrWhiteSpace(t.ClienteFacturacion.RazonSocial) ? t.ClienteFacturacion.RazonSocial : $"{t.ClienteFacturacion.Nombres} {t.ClienteFacturacion.Apellidos}".Trim())
                    : null,
                t.ClienteFacturacion?.CodigoCliente,
                t.DuracionEstimadaMinutos,
                t.Activo))
            .OrderBy(t => t.ClienteFacturacionNombre ?? "")
            .ThenBy(t => t.CodigoTarea)
            .ToList();

        return Result<List<TipoTareaServicioDto>>.Success(lista);
    }
}
