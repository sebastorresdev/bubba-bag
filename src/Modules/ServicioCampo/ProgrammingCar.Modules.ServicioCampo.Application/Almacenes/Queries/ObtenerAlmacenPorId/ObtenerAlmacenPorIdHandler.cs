using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenPorId;

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
            .Where(a => a.Id == query.Id && (_user.IsAuthenticated && _user.HasPermission(ProgrammingCar.SharedKernel.Authorization.Permissions.Inventario.AccesosGestionar) || InventarioAcceso.AlmacenesConsultables(_context, _user).Contains(a.Id)))
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
                a.UpdatedAt,
                false,
                false,
                false,
                a.AlmacenPadreId,
                a.AlmacenPadre != null ? a.AlmacenPadre.Nombre : null
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
