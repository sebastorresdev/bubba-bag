using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Queries.ObtenerMotivoIncidenciaPorId;

public class ObtenerMotivoIncidenciaPorIdHandler : IQueryHandler<ObtenerMotivoIncidenciaPorIdQuery, Result<MotivoIncidenciaDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerMotivoIncidenciaPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<MotivoIncidenciaDto>> HandleAsync(ObtenerMotivoIncidenciaPorIdQuery request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosIncidencia.AsNoTracking()
            .Where(m => m.Id == request.Id)
            .Select(m => new MotivoIncidenciaDto(
                m.Id,
                m.Codigo,
                m.Nombre,
                m.Descripcion,
                m.Ambito,
                m.Activo))
            .FirstOrDefaultAsync(cancellationToken);

        return motivo != null
            ? Result<MotivoIncidenciaDto>.Success(motivo)
            : Result<MotivoIncidenciaDto>.Failure("Motivo de incidencia no encontrado.");
    }
}
