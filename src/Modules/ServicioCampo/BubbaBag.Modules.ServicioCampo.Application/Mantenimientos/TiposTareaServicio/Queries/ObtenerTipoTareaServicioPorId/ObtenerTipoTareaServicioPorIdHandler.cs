using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Queries.ObtenerTipoTareaServicioPorId;

public class ObtenerTipoTareaServicioPorIdHandler : IQueryHandler<ObtenerTipoTareaServicioPorIdQuery, Result<TipoTareaServicioDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTipoTareaServicioPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TipoTareaServicioDto>> HandleAsync(ObtenerTipoTareaServicioPorIdQuery request, CancellationToken cancellationToken)
    {
        var t = await _context.TiposTareaServicio.AsNoTracking()
            .Include(t => t.ClienteFacturacion)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (t == null)
            return Result<TipoTareaServicioDto>.Failure("Tipo de tarea de servicio no encontrado.");

        var dto = new TipoTareaServicioDto(
            t.Id,
            t.CodigoTarea,
            t.Nombre,
            t.ClienteFacturacionId,
            t.ClienteFacturacion != null
                ? (!string.IsNullOrWhiteSpace(t.ClienteFacturacion.RazonSocial) ? t.ClienteFacturacion.RazonSocial : $"{t.ClienteFacturacion.Nombres} {t.ClienteFacturacion.Apellidos}".Trim())
                : null,
            t.ClienteFacturacion?.CodigoCliente,
            t.DuracionEstimadaMinutos,
            t.Activo);

        return Result<TipoTareaServicioDto>.Success(dto);
    }
}
