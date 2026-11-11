using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.Authorization;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.OrdenesTrabajo;

public static class OrdenesAcceso
{
    public static IQueryable<OrdenTrabajo> Consultables(
        IServicioCampoDbContext db, 
        ICurrentUser user, 
        IEnumerable<Guid>? equipoUserIds = null)
    {
        var query = db.OrdenesTrabajo.AsQueryable();
        if (!user.IsAuthenticated || user.Id == Guid.Empty || !user.HasPermission(Permissions.ServicioCampo.Acceso))
            return query.Where(o => false);
        if (user.HasPermission(Permissions.ServicioCampo.OrdenesVerTodas)) return query;

        var asignadas = user.HasPermission(Permissions.ServicioCampo.OrdenesVerAsignadas);
        var creador = user.HasPermission(Permissions.ServicioCampo.OrdenesCrear);
        var verPropias = user.HasPermission(Permissions.ServicioCampo.SolicitudesVerPropias);
        var verEquipo = user.HasPermission(Permissions.ServicioCampo.SolicitudesVerEquipo);
        var liquidadorAlmacen = (user.HasPermission(Permissions.ServicioCampo.OrdenesLiquidarMateriales)
                              || user.HasPermission(Permissions.Inventario.Operar))
                              && !user.HasPermission(Permissions.ServicioCampo.OrdenesOperarCampo);

        var equipoList = equipoUserIds?.ToList() ?? new List<Guid>();

        return query.Where(o =>
            ((creador || verPropias) && o.CreadoPorId == user.Id) ||
            (verEquipo && (o.CreadoPorId == user.Id || equipoList.Contains(o.CreadoPorId))) ||
            (asignadas && o.Visitas.Any(v =>
                v.NumeroVisita == o.Visitas.Max(x => x.NumeroVisita) && v.Estado != EstadoVisita.Cancelada
                && v.Recurso.Activo && v.Recurso.UsuarioId == user.Id)) ||
            (liquidadorAlmacen && o.DescargaMaterialesObligatoria)
        );
    }

    public static async Task ExigirAsync(
        IServicioCampoDbContext db, 
        ICurrentUser user, 
        Guid id, 
        CancellationToken ct,
        IEnumerable<Guid>? equipoUserIds = null)
    {
        if (!await Consultables(db, user, equipoUserIds).AnyAsync(o => o.Id == id, ct)) 
            throw new UnauthorizedAccessException();
    }
}
