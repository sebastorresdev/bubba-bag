using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes;

public static class InventarioAcceso
{
    public static IQueryable<Guid> AlmacenesConsultables(IServicioCampoDbContext db, ICurrentUser user)
    {
        if (!user.IsAuthenticated || user.Id == Guid.Empty)
            return db.Almacenes.Where(_ => false).Select(x => x.Id);

        if (user.IsInRole(Roles.SuperAdmin) || user.IsInRole(Roles.InventarioAdmin))
            return db.Almacenes.Select(x => x.Id);

        // Almacenes con autorización directa
        var directosQuery = db.UsuarioAlmacenAutorizaciones
            .Where(x => x.UsuarioId == user.Id && x.Activo && x.PuedeConsultar)
            .Select(x => x.AlmacenId);

        // Unidades organizativas de las bodegas que el usuario puede consultar
        var unidadesOrgUsuario = db.Almacenes
            .Where(a => directosQuery.Contains(a.Id) && a.UnidadOrganizativaId.HasValue)
            .Select(a => a.UnidadOrganizativaId!.Value);

        // Retornar los almacenes directos MÁS las custodias personales cuyo AlmacenPadreId esté en directosQuery
        // (o fallback a la misma unidad organizativa si no tiene AlmacenPadreId)
        return db.Almacenes
            .Where(a => directosQuery.Contains(a.Id) ||
                        (a.Tipo == TipoAlmacen.CustodiaPersonal &&
                         ((a.AlmacenPadreId.HasValue && directosQuery.Contains(a.AlmacenPadreId.Value)) ||
                          (!a.AlmacenPadreId.HasValue && a.UnidadOrganizativaId.HasValue && unidadesOrgUsuario.Contains(a.UnidadOrganizativaId.Value)))))
            .Select(a => a.Id);
    }

    public static async Task<bool> PuedeAsync(IServicioCampoDbContext db, ICurrentUser user, Guid almacenId, string accion, CancellationToken ct)
    {
        if (!user.IsAuthenticated || user.Id == Guid.Empty) return false;
        if (user.IsInRole(Roles.SuperAdmin) || user.IsInRole(Roles.InventarioAdmin)) return true;

        // 1. Autorización directa en el almacén
        var directa = await db.UsuarioAlmacenAutorizaciones.AnyAsync(x => x.UsuarioId == user.Id && x.AlmacenId == almacenId && x.Activo &&
            (accion == "consultar" && x.PuedeConsultar || accion == "despachar" && x.PuedeDespachar || accion == "recibir" && x.PuedeRecepcionar || accion == "supervisar" && x.EsSupervisor), ct);

        if (directa) return true;

        // 2. Si el almacén objetivo es CustodiaPersonal de un técnico:
        // Prioridad 1: Hereda directamente de los permisos de la bodega padre (AlmacenPadreId)
        var almacen = await db.Almacenes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == almacenId, ct);
        if (almacen != null && almacen.Tipo == TipoAlmacen.CustodiaPersonal)
        {
            if (almacen.AlmacenPadreId.HasValue)
            {
                var padreDirecto = await db.UsuarioAlmacenAutorizaciones
                    .AnyAsync(x => x.UsuarioId == user.Id && x.AlmacenId == almacen.AlmacenPadreId.Value && x.Activo &&
                                   (accion == "consultar" && x.PuedeConsultar ||
                                    accion == "despachar" && (x.PuedeDespachar || x.PuedeRecepcionar) ||
                                    accion == "recibir" && (x.PuedeRecepcionar || x.PuedeDespachar) ||
                                    accion == "supervisar" && x.EsSupervisor), ct);

                if (padreDirecto) return true;
            }
            else if (almacen.UnidadOrganizativaId.HasValue)
            {
                // Fallback por sede si aún no tenía padre asignado
                return await db.UsuarioAlmacenAutorizaciones
                    .Include(x => x.Almacen)
                    .AnyAsync(x => x.UsuarioId == user.Id && x.Activo &&
                                   x.Almacen != null && x.Almacen.Tipo == TipoAlmacen.Bodega &&
                                   x.Almacen.UnidadOrganizativaId == almacen.UnidadOrganizativaId &&
                                   (accion == "consultar" && x.PuedeConsultar ||
                                    accion == "despachar" && (x.PuedeDespachar || x.PuedeRecepcionar) ||
                                    accion == "recibir" && (x.PuedeRecepcionar || x.PuedeDespachar) ||
                                    accion == "supervisar" && x.EsSupervisor), ct);
            }
        }

        return false;
    }

    public static async Task<UbicacionInventario?> UbicacionAsync(IServicioCampoDbContext db, Guid almacenId, Guid? ubicacionId, CancellationToken ct)
    {
        if (ubicacionId.HasValue)
            return await db.UbicacionesInventario.Include(x => x.Almacen).FirstOrDefaultAsync(x => x.AlmacenId == almacenId && x.Id == ubicacionId.Value && x.Activa && x.Almacen.Activo, ct);

        var principal = await db.UbicacionesInventario.Include(x => x.Almacen).FirstOrDefaultAsync(x => x.AlmacenId == almacenId && x.Activa && x.Almacen.Activo && x.EsPrincipal, ct);
        if (principal != null) return principal;

        return await db.UbicacionesInventario.Include(x => x.Almacen).FirstOrDefaultAsync(x => x.AlmacenId == almacenId && x.Activa && x.Almacen.Activo, ct);
    }
}
