using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenes;

public record ObtenerAlmacenesQuery(
    bool? SoloActivos = true
) : IQuery<Result<List<AlmacenDto>>>;

public class ObtenerAlmacenesHandler : IQueryHandler<ObtenerAlmacenesQuery, Result<List<AlmacenDto>>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _user;

    public ObtenerAlmacenesHandler(IServicioCampoDbContext context, ICurrentUser user)
    {
        _context = context; _user = user;
    }

    public async Task<Result<List<AlmacenDto>>> HandleAsync(ObtenerAlmacenesQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Almacenes.AsNoTracking();
        if (!_user.IsAuthenticated || !_user.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.AccesosGestionar))
            dbQuery = dbQuery.Where(a => InventarioAcceso.AlmacenesConsultables(_context, _user).Contains(a.Id));

        if (query.SoloActivos.HasValue)
            dbQuery = dbQuery.Where(a => a.Activo == query.SoloActivos.Value);

        var almacenes = await dbQuery
            .OrderBy(a => a.Tipo)
            .ThenBy(a => a.Nombre)
            .ToListAsync(cancellationToken);

        var uoIds = almacenes.Where(a => a.UnidadOrganizativaId.HasValue).Select(a => a.UnidadOrganizativaId!.Value).Distinct().ToList();
        var unidadesMap = await _context.UnidadesOrganizativas
            .Where(u => uoIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Nombre, cancellationToken);

        var recIds = almacenes.Where(a => a.RecursoId.HasValue).Select(a => a.RecursoId!.Value).Distinct().ToList();
        var recursosMap = await _context.Recursos
            .Where(r => recIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, r => r.NombreCompleto, cancellationToken);

        var permisos = await _context.UsuarioAlmacenAutorizaciones.Where(x=>x.UsuarioId==_user.Id && x.Activo).ToDictionaryAsync(x=>x.AlmacenId,cancellationToken);
        var global = _user.IsAuthenticated && _user.IsInRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin);
        var lista = almacenes.Select(a => new AlmacenDto(
            a.Id,
            a.Codigo ?? $"ALM-{a.Id.ToString()[..6].ToUpperInvariant()}",
            a.Nombre,
            a.Descripcion,
            a.Tipo,
            a.UnidadOrganizativaId,
            a.UnidadOrganizativaId.HasValue && unidadesMap.TryGetValue(a.UnidadOrganizativaId.Value, out var uoNom) ? uoNom : null,
            a.RecursoId,
            a.RecursoId.HasValue && recursosMap.TryGetValue(a.RecursoId.Value, out var rNom) ? rNom : null,
            a.Activo,
            a.CreadoPorId,
            a.CreadoPorNombre,
            a.CreatedAt,
            a.ActualizadoPorId,
            a.UpdatedAt,
            global || permisos.TryGetValue(a.Id,out var pd) && pd.PuedeDespachar,
            global || permisos.TryGetValue(a.Id,out var pr) && pr.PuedeRecepcionar,
            global || permisos.TryGetValue(a.Id,out var ps) && ps.EsSupervisor
        )).ToList();

        return Result<List<AlmacenDto>>.Success(lista);
    }
}
