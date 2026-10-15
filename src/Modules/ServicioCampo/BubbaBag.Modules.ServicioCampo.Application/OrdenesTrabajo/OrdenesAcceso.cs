using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.OrdenesTrabajo;

public static class OrdenesAcceso
{
    public static IQueryable<OrdenTrabajo> Consultables(IServicioCampoDbContext db, ICurrentUser user)
    {
        var query = db.OrdenesTrabajo.AsQueryable();
        if (!user.IsAuthenticated || user.Id == Guid.Empty || !user.HasPermission(Permissions.ServicioCampo.Acceso))
            return query.Where(o => false);
        if (user.HasPermission(Permissions.ServicioCampo.OrdenesVerTodas)) return query;
        var asignadas = user.HasPermission(Permissions.ServicioCampo.OrdenesVerAsignadas);
        var creador = user.HasPermission(Permissions.ServicioCampo.OrdenesCrear);
        // Sólo la asignación más reciente autoriza; una visita antigua no conserva el acceso de un técnico reasignado.
        return query.Where(o => creador && o.CreadoPorId == user.Id || asignadas && o.Visitas.Any(v =>
            v.NumeroVisita == o.Visitas.Max(x => x.NumeroVisita) && v.Estado != EstadoVisita.Cancelada
            && v.Recurso.Activo && v.Recurso.UsuarioId == user.Id));
    }

    public static async Task ExigirAsync(IServicioCampoDbContext db, ICurrentUser user, Guid id, CancellationToken ct)
    {
        if (!await Consultables(db, user).AnyAsync(o => o.Id == id, ct)) throw new UnauthorizedAccessException();
    }
}
