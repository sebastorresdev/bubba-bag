using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class UbicacionesEndpoints
{
    public static void MapUbicacionesEndpoints(this IEndpointRouteBuilder app)
    {
        var g=app.MapGroup("/api/inventario/almacenes").RequireAuthorization(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.Acceso).WithTags("Inventario - Ubicaciones y autorizaciones");
        g.MapGet("/usuarios-autorizables",ObtenerUsuariosAutorizables);
        g.MapGet("/{id:guid}/ubicaciones",ObtenerUbicaciones);
        g.MapPost("/{id:guid}/ubicaciones",CrearUbicacion);
        g.MapPatch("/{id:guid}/ubicaciones/{ubicacionId:guid}/estado",CambiarEstadoUbicacion);
        g.MapGet("/{id:guid}/destinos",ObtenerDestinos);
        g.MapGet("/{id:guid}/autorizaciones",ObtenerAutorizaciones);
        g.MapPut("/{id:guid}/autorizaciones/{usuarioId:guid}",GuardarAutorizacion);
    }

    private static async Task<IResult> ObtenerUsuariosAutorizables(ICurrentUser user,BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios)
    {
        if(!user.IsAuthenticated || !user.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin,BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin,BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin)) return Results.Forbid();
        var resultado=await usuarios.ObtenerUsuariosAsync();
        return resultado.IsSuccess ? Results.Ok(resultado.Value) : Results.BadRequest(resultado.Error);
    }

    private static async Task<IResult> ObtenerUbicaciones(Guid id,Guid? origenId,IServicioCampoDbContext db,ICurrentUser user,CancellationToken ct)
    {
        var puede=user.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.AccesosGestionar) || await InventarioAcceso.PuedeAsync(db,user,id,"consultar",ct);
        if(!puede && origenId.HasValue && await InventarioAcceso.PuedeAsync(db,user,origenId.Value,"despachar",ct))
        {
            var origen=await db.Almacenes.FindAsync([origenId.Value],ct);
            var destino=await db.Almacenes.FindAsync([id],ct);
            puede=origen!=null && destino!=null && DestinoPermitido(origen,destino);
        }
        if(!puede) return Results.Forbid();
        return Results.Ok(await db.UbicacionesInventario.Where(x=>x.AlmacenId==id && x.Activa).OrderByDescending(x=>x.EsPrincipal).ThenBy(x=>x.Nombre).Select(x=>new{x.Id,x.AlmacenId,x.Codigo,x.Nombre,x.EsPrincipal,x.Activa}).ToListAsync(ct));
    }

    private static async Task<IResult> CrearUbicacion(Guid id,CrearUbicacionRequest r,IServicioCampoDbContext db,ICurrentUser user,CancellationToken ct)
    {
        if(!await InventarioAcceso.PuedeAsync(db,user,id,"supervisar",ct)) return Results.Forbid();
        if(!await db.Almacenes.AnyAsync(x=>x.Id==id && x.Activo,ct)) return Results.BadRequest("El almacén no está activo.");
        if(string.IsNullOrWhiteSpace(r.Codigo)||string.IsNullOrWhiteSpace(r.Nombre)||r.Codigo.Length>50||r.Nombre.Length>150) return Results.BadRequest("Revise código y nombre.");
        if(await db.UbicacionesInventario.AnyAsync(x=>x.AlmacenId==id && x.Codigo==r.Codigo.Trim().ToUpperInvariant(),ct)) return Results.BadRequest("El código ya existe en el almacén.");
        var u=UbicacionInventario.Crear(id,r.Codigo,r.Nombre); db.UbicacionesInventario.Add(u); await db.SaveChangesAsync(ct);
        return Results.Created($"/api/inventario/almacenes/{id}/ubicaciones",new{id=u.Id});
    }

    private static async Task<IResult> CambiarEstadoUbicacion(Guid id,Guid ubicacionId,CambiarEstadoRequest r,IServicioCampoDbContext db,ICurrentUser user,CancellationToken ct)
    {
        if(!await InventarioAcceso.PuedeAsync(db,user,id,"supervisar",ct)) return Results.Forbid();
        var u=await db.UbicacionesInventario.SingleOrDefaultAsync(x=>x.Id==ubicacionId && x.AlmacenId==id,ct);
        if(u==null) return Results.NotFound();
        if(!r.Activo && (u.EsPrincipal || await db.StocksAlmacen.AnyAsync(x=>x.UbicacionId==u.Id && (x.CantidadDisponible>0 || x.CantidadReservada>0),ct) || await db.ItemsSeriados.AnyAsync(x=>x.UbicacionActualId==u.Id,ct) || await db.Transferencias.AnyAsync(x=>(x.UbicacionOrigenId==u.Id||x.UbicacionDestinoId==u.Id) && (x.Estado==EstadoTransferencia.EnTransito||x.Estado==EstadoTransferencia.ParcialmenteRecibida),ct))) return Results.BadRequest("Principal, stock o tránsito pendiente impiden desactivar la ubicación.");
        u.CambiarEstado(r.Activo); await db.SaveChangesAsync(ct); return Results.NoContent();
    }

    private static bool DestinoPermitido(Almacen a,Almacen b)=>b.Activo && a.UnidadOrganizativaId.HasValue && b.UnidadOrganizativaId.HasValue &&
        (a.Id==b.Id || a.Tipo==TipoAlmacen.Bodega && (b.Tipo==TipoAlmacen.Bodega || a.UnidadOrganizativaId==b.UnidadOrganizativaId) || a.Tipo==TipoAlmacen.CustodiaPersonal && b.Tipo==TipoAlmacen.Bodega && a.UnidadOrganizativaId==b.UnidadOrganizativaId);

    private static async Task<IResult> ObtenerDestinos(Guid id,IServicioCampoDbContext db,ICurrentUser user,CancellationToken ct)
    {
        if(!await InventarioAcceso.PuedeAsync(db,user,id,"despachar",ct)) return Results.Forbid();
        var origen=await db.Almacenes.FindAsync([id],ct); if(origen==null) return Results.NotFound();
        var almacenes=await db.Almacenes.Where(x=>x.Activo).OrderBy(x=>x.Nombre).ToListAsync(ct);
        return Results.Ok(almacenes.Where(x=>DestinoPermitido(origen,x)).Select(x=>new{x.Id,x.Codigo,x.Nombre,Tipo=(int)x.Tipo,x.UnidadOrganizativaId,x.RecursoId,x.Activo}));
    }

    private static async Task<IResult> ObtenerAutorizaciones(Guid id,IServicioCampoDbContext db,ICurrentUser user,CancellationToken ct)
    {
        if(!await InventarioAcceso.PuedeAsync(db,user,id,"supervisar",ct) && !user.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin,BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin,BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin)) return Results.Forbid();
        return Results.Ok(await db.UsuarioAlmacenAutorizaciones.Where(x=>x.AlmacenId==id).Select(x=>new{x.UsuarioId,x.PuedeConsultar,x.PuedeDespachar,x.PuedeRecepcionar,x.EsSupervisor,x.Activo}).ToListAsync(ct));
    }

    private static async Task<IResult> GuardarAutorizacion(Guid id,Guid usuarioId,AutorizacionRequest r,IServicioCampoDbContext db,ICurrentUser user,BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios,CancellationToken ct)
    {
        // Solo administración global puede otorgar facultades; un supervisor no se autoeleva ni delega acceso.
        if(!user.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin,BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin,BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin) || !user.IsAuthenticated) return Results.Forbid();
        if(usuarioId==Guid.Empty || !await db.Almacenes.AnyAsync(x=>x.Id==id,ct)) return Results.BadRequest("Usuario o almacén inválido.");
        var cuenta=await usuarios.ObtenerUsuarioPorIdAsync(usuarioId);
        if(cuenta.IsFailure || r.Activo && !cuenta.Value.EsActivo) return Results.BadRequest("El usuario no existe o está inactivo.");
        if(r.Activo && !r.PuedeConsultar && (r.PuedeDespachar||r.PuedeRecepcionar||r.EsSupervisor)) return Results.BadRequest("Las facultades operativas requieren permiso de consulta.");
        var a=await db.UsuarioAlmacenAutorizaciones.SingleOrDefaultAsync(x=>x.UsuarioId==usuarioId && x.AlmacenId==id,ct);
        if(a==null){a=UsuarioAlmacenAutorizacion.Crear(usuarioId,id,r.PuedeConsultar,r.PuedeDespachar,r.PuedeRecepcionar,r.EsSupervisor);db.UsuarioAlmacenAutorizaciones.Add(a);}
        else a.ActualizarPermisos(r.PuedeConsultar,r.PuedeDespachar,r.PuedeRecepcionar,r.EsSupervisor);
        if(r.Activo)a.Activar();else a.Desactivar(); await db.SaveChangesAsync(ct);return Results.NoContent();
    }
}
public record CrearUbicacionRequest(string Codigo,string Nombre);
public record AutorizacionRequest(bool PuedeConsultar,bool PuedeDespachar,bool PuedeRecepcionar,bool EsSupervisor,bool Activo=true);
