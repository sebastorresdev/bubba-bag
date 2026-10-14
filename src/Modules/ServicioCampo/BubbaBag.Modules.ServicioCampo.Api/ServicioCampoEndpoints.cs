using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class ServicioCampoEndpoints
{
    public static void MapServicioCampoEndpoints(this IEndpointRouteBuilder app)
    {
        // Submódulos consolidados en Servicio de Campo
        app.MapClientesEndpoints();
        app.MapOrdenesTrabajoEndpoints();
        app.MapAlmacenesEndpoints();
        app.MapAjustesEndpoints();
        app.MapProductosEndpoints();
        app.MapCatalogosProductoEndpoints();
        app.MapMantenimientosEndpoints();
        app.MapConfiguracionesServicioEndpoints();
        app.MapOrganizacionEndpoints();
        app.MapEmpresaEndpoints();
    }
}
