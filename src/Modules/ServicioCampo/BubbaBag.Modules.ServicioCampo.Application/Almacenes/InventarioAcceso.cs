using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes;

public static class InventarioAcceso
{
    public static IQueryable<Guid> AlmacenesConsultables(IServicioCampoDbContext db, ICurrentUser user)
        => user.IsAuthenticated && user.IsInRole(Roles.SuperAdmin)
            ? db.Almacenes.Select(x => x.Id)
            : db.UsuarioAlmacenAutorizaciones.Where(x => x.UsuarioId == user.Id && x.Activo && x.PuedeConsultar && user.IsAuthenticated).Select(x => x.AlmacenId);

    public static Task<bool> PuedeAsync(IServicioCampoDbContext db, ICurrentUser user, Guid almacenId, string accion, CancellationToken ct)
    {
        if (!user.IsAuthenticated || user.Id == Guid.Empty) return Task.FromResult(false);
        if (user.IsInRole(Roles.SuperAdmin)) return Task.FromResult(true);
        return db.UsuarioAlmacenAutorizaciones.AnyAsync(x => x.UsuarioId == user.Id && x.AlmacenId == almacenId && x.Activo &&
            (accion == "consultar" && x.PuedeConsultar || accion == "despachar" && x.PuedeDespachar || accion == "recibir" && x.PuedeRecepcionar || accion == "supervisar" && x.EsSupervisor), ct);
    }

    public static Task<UbicacionInventario?> UbicacionAsync(IServicioCampoDbContext db, Guid almacenId, Guid? ubicacionId, CancellationToken ct)
        => db.UbicacionesInventario.Include(x => x.Almacen).FirstOrDefaultAsync(x => x.AlmacenId == almacenId && x.Activa && x.Almacen.Activo &&
            (ubicacionId.HasValue ? x.Id == ubicacionId.Value : x.EsPrincipal), ct);
}
