using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.Authorization;

namespace ProgrammingCar.Modules.GestionDatos.Application.Services;

public static class ImportacionAcceso
{
    public static readonly string[] Entidades = ["Usuario", "Cliente", "Producto", "Categoria", "UnidadMedida", "Territorio", "UnidadOrganizativa", "InventarioInicial"];

    public static bool PuedeGestionarEntidad(ICurrentUser user, string entidad)
    {
        if (!user.IsAuthenticated || user.Id == Guid.Empty) return false;
        return entidad.ToLowerInvariant() switch
        {
            "usuario" => user.HasPermission(Permissions.Seguridad.UsuariosGestionar),
            "cliente" => user.HasPermission(Permissions.Crm.Acceso) && user.HasPermission(Permissions.Crm.ClientesCrear),
            "unidadorganizativa" => user.HasPermission(Permissions.Configuracion.SucursalesGestionar),
            "inventarioinicial" => user.HasPermission(Permissions.Inventario.Acceso) && user.HasPermission(Permissions.Inventario.Operar),
            "producto" or "categoria" or "unidadmedida" or "territorio" => user.HasPermission(Permissions.Inventario.Acceso) && user.HasPermission(Permissions.Inventario.CatalogosGestionar),
            _ => false
        };
    }

    public static bool PuedeConsultarEntidad(ICurrentUser user, string entidad) => user.IsAuthenticated && user.Id != Guid.Empty &&
        (user.IsInRole(Roles.SuperAdmin) || (entidad.ToLowerInvariant() switch
        {
            "usuario" => user.HasPermission(Permissions.Seguridad.UsuariosGestionar),
            "cliente" => user.HasPermission(Permissions.Crm.Acceso) && user.HasPermission(Permissions.Crm.ClientesVer),
            "unidadorganizativa" => user.HasPermission(Permissions.Configuracion.SucursalesGestionar)
                || user.HasPermission(Permissions.Configuracion.SucursalesEstadoGestionar) || user.HasPermission(Permissions.Configuracion.SucursalesSedePrincipalGestionar),
            "inventarioinicial" or "producto" or "categoria" or "unidadmedida" or "territorio" => user.HasPermission(Permissions.Inventario.Acceso),
            _ => false
        }));
}
