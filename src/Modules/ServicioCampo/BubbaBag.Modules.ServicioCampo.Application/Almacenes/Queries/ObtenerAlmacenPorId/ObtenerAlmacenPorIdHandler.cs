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
    private readonly ICurrentUser _user;

    public ObtenerAlmacenPorIdHandler(IServicioCampoDbContext context, ICurrentUser user)
    {
        _context = context; _user = user;
    }

    public async Task<Result<AlmacenDto>> HandleAsync(ObtenerAlmacenPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var dto = await _context.Almacenes
            .AsNoTracking()
            .Where(a => a.Id == query.Id && (_user.IsAuthenticated && _user.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.AccesosGestionar) || InventarioAcceso.AlmacenesConsultables(_context, _user).Contains(a.Id)))
            .Select(a => new AlmacenDto(
                a.Id,
                a.Codigo,
                a.Nombre,
                a.Descripcion,
                a.Tipo,
                a.UnidadOrganizativaId,
                null,
                a.RecursoId,
                null,
                a.Activo,
                a.CreadoPorId,
                a.CreadoPorNombre,
                a.CreatedAt,
                a.ActualizadoPorId,
                a.UpdatedAt
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (dto is null)
            return Result<AlmacenDto>.Failure($"No se encontró el almacén con ID '{query.Id}'.");

        dto = dto with {
            PuedeDespachar = await InventarioAcceso.PuedeAsync(_context,_user,query.Id,"despachar",cancellationToken),
            PuedeRecepcionar = await InventarioAcceso.PuedeAsync(_context,_user,query.Id,"recibir",cancellationToken),
            EsSupervisor = await InventarioAcceso.PuedeAsync(_context,_user,query.Id,"supervisar",cancellationToken)
        };
        return Result<AlmacenDto>.Success(dto);
    }
}
