using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Dtos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenes;

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
        if (!_user.IsAuthenticated || !_user.HasPermission(ProgrammingCar.SharedKernel.Authorization.Permissions.Inventario.AccesosGestionar))
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

        var nombresAlmacenesMap = almacenes.ToDictionary(a => a.Id, a => a.Nombre);

        var autorizaciones = await _context.UsuarioAlmacenAutorizaciones
            .Include(x => x.Almacen)
            .Where(x => x.UsuarioId == _user.Id && x.Activo)
            .ToListAsync(cancellationToken);

        var permisosDirectos = autorizaciones.ToDictionary(x => x.AlmacenId);
        var permisosPorUnidadOrg = autorizaciones
            .Where(x => x.Almacen != null && x.Almacen.Tipo == TipoAlmacen.Bodega && x.Almacen.UnidadOrganizativaId.HasValue)
            .GroupBy(x => x.Almacen!.UnidadOrganizativaId!.Value)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    PuedeDespachar = g.Any(x => x.PuedeDespachar),
                    PuedeRecepcionar = g.Any(x => x.PuedeRecepcionar),
                    EsSupervisor = g.Any(x => x.EsSupervisor)
                });

        var global = _user.IsAuthenticated && (_user.IsInRole(ProgrammingCar.SharedKernel.Authorization.Roles.SuperAdmin) || _user.IsInRole(ProgrammingCar.SharedKernel.Authorization.Roles.InventarioAdmin));

        var lista = almacenes.Select(a =>
        {
            bool puedeDespachar = global;
            bool puedeRecepcionar = global;
            bool esSupervisor = global;

            if (permisosDirectos.TryGetValue(a.Id, out var pd))
            {
                puedeDespachar = puedeDespachar || pd.PuedeDespachar;
                puedeRecepcionar = puedeRecepcionar || pd.PuedeRecepcionar;
                esSupervisor = esSupervisor || pd.EsSupervisor;
            }
            else if (a.Tipo == TipoAlmacen.CustodiaPersonal && a.AlmacenPadreId.HasValue && permisosDirectos.TryGetValue(a.AlmacenPadreId.Value, out var pp))
            {
                // Hereda directamente de su bodega padre asignada
                puedeDespachar = puedeDespachar || pp.PuedeDespachar || pp.PuedeRecepcionar;
                puedeRecepcionar = puedeRecepcionar || pp.PuedeRecepcionar || pp.PuedeDespachar;
                esSupervisor = esSupervisor || pp.EsSupervisor;
            }
            else if (a.Tipo == TipoAlmacen.CustodiaPersonal && a.UnidadOrganizativaId.HasValue && permisosPorUnidadOrg.TryGetValue(a.UnidadOrganizativaId.Value, out var pu))
            {
                // Fallback a nivel sede solo si aún no tenía bodega padre
                puedeDespachar = puedeDespachar || pu.PuedeDespachar || pu.PuedeRecepcionar;
                puedeRecepcionar = puedeRecepcionar || pu.PuedeRecepcionar || pu.PuedeDespachar;
                esSupervisor = esSupervisor || pu.EsSupervisor;
            }

            return new AlmacenDto(
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
                puedeDespachar,
                puedeRecepcionar,
                esSupervisor,
                a.AlmacenPadreId,
                a.AlmacenPadreId.HasValue && nombresAlmacenesMap.TryGetValue(a.AlmacenPadreId.Value, out var apNom) ? apNom : null
            );
        }).ToList();

        return Result<List<AlmacenDto>>.Success(lista);
    }
}
