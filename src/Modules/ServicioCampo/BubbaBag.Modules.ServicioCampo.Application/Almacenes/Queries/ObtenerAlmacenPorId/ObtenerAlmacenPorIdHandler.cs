using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenPorId;

public record ObtenerAlmacenPorIdQuery(Guid Id) : IQuery<Result<AlmacenDto>>;

public class ObtenerAlmacenPorIdHandler : IQueryHandler<ObtenerAlmacenPorIdQuery, Result<AlmacenDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerAlmacenPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AlmacenDto>> HandleAsync(ObtenerAlmacenPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var dto = await _context.Almacenes
            .AsNoTracking()
            .Where(a => a.Id == query.Id)
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
            .FirstOrDefaultAsync(cancellationToken);

        if (dto is null)
            return Result<AlmacenDto>.Failure($"No se encontró el almacén con ID '{query.Id}'.");

        return Result<AlmacenDto>.Success(dto);
    }
}
