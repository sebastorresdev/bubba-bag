using BubbaBag.Modules.ServicioCampo.Application;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.ServicioCampo.Api;

internal sealed class OrdenMutationFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        if (HttpMethods.IsGet(http.Request.Method) || !Guid.TryParse(http.Request.RouteValues["id"]?.ToString(), out var id))
            return await next(context);
        var db = http.RequestServices.GetRequiredService<IServicioCampoDbContext>();
        object? result = null;
        await db.EjecutarConBloqueoOrdenAsync(id, async ct =>
        {
            var expected = http.Request.Headers.IfMatch.ToString().Trim('"');
            if (HttpMethods.IsPut(http.Request.Method) && string.IsNullOrEmpty(expected))
            {
                await Application.OrdenesTrabajo.OrdenesAcceso.ExigirAsync(db, http.RequestServices.GetRequiredService<BubbaBag.SharedKernel.ICurrentUser>(), id, ct);
                result = Results.Json(new { message = "Recargue la orden antes de editar: falta la versión del registro (If-Match)." }, statusCode: 428);
                return;
            }
            if (!string.IsNullOrEmpty(expected))
            {
                if (!uint.TryParse(expected, out var version)) { result = Results.BadRequest(new { message = "La versión enviada no es válida." }); return; }
                await Application.OrdenesTrabajo.OrdenesAcceso.ExigirAsync(db, http.RequestServices.GetRequiredService<BubbaBag.SharedKernel.ICurrentUser>(), id, ct);
                var current = await db.OrdenesTrabajo.AsNoTracking().Where(o => o.Id == id).Select(o => o.Version).SingleAsync(ct);
                if (version != current) { result = Results.Conflict(new { message = "La orden cambió desde que la abrió. Recargue y revise los cambios antes de guardar." }); return; }
            }
            try
            {
                result = await next(context);
                var status = (result as IStatusCodeHttpResult)?.StatusCode ?? 200;
                var orden = db.OrdenesTrabajo.Local.FirstOrDefault(o => o.Id == id);
                if (status < 300 && orden != null && ((DbContext)db).Entry(orden).State != EntityState.Deleted)
                {
                    orden.RegistrarModificacion();
                    await db.SaveChangesAsync(ct);
                    http.Response.Headers.ETag = $"\"{orden.Version}\"";
                }
            }
            catch (InvalidOperationException ex) { result = Results.BadRequest(new { message = ex.Message }); }
        }, http.RequestAborted);
        return result;
    }
}
