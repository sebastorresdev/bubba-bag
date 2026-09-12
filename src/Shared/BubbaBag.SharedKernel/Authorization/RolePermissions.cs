using System;
using System.Collections.Generic;

namespace BubbaBag.SharedKernel.Authorization;

public static class RolePermissions
{
    private static readonly Dictionary<string, HashSet<string>> _rolePermissions = new(StringComparer.OrdinalIgnoreCase)
    {
        // 1. SuperAdmin: acceso absoluto a todo (bypass implementado en handler también)
        [Roles.SuperAdmin] = new HashSet<string>(Permissions.GetAll(), StringComparer.OrdinalIgnoreCase),

        // 2. Gerencia: visualización ejecutiva y confidencial de todos los módulos
        [Roles.Gerencia] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.ServicioCampo.Acceso,
            Permissions.ServicioCampo.OrdenesVerTodas,
            Permissions.ServicioCampo.OrdenesVerAsignadas,
            Permissions.ServicioCampo.OrdenesCrear,
            Permissions.ServicioCampo.OrdenesAsignar,
            Permissions.ServicioCampo.OrdenesCerrar,
            Permissions.ServicioCampo.TarifariosGestionar,
            Permissions.ServicioCampo.CatalogosGestionar,

            Permissions.Crm.Acceso,
            Permissions.Crm.ClientesVer,
            Permissions.Crm.ClientesCrear,
            Permissions.Crm.ClientesEditar,
            Permissions.Crm.SegmentacionAvanzada,

            Permissions.Rrhh.Acceso,
            Permissions.Rrhh.ColaboradoresVer,
            Permissions.Rrhh.SalariosConfidencial,

            Permissions.Seguridad.Acceso,
        },

        // 3. Recursos Humanos: Administrador
        [Roles.RrhhAdmin] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Rrhh.Acceso,
            Permissions.Rrhh.ColaboradoresVer,
            Permissions.Rrhh.ColaboradoresGestionar,
            Permissions.Rrhh.SalariosConfidencial,
            Permissions.Rrhh.CatalogosGestionar,
        },

        // 4. Recursos Humanos: Asistente
        [Roles.RrhhAsistente] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Rrhh.Acceso,
            Permissions.Rrhh.ColaboradoresVer,
            Permissions.Rrhh.ColaboradoresGestionar,
        },

        // 5. Servicio de Campo: Administrador
        [Roles.ServicioCampoAdmin] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.ServicioCampo.Acceso,
            Permissions.ServicioCampo.OrdenesVerTodas,
            Permissions.ServicioCampo.OrdenesVerAsignadas,
            Permissions.ServicioCampo.OrdenesCrear,
            Permissions.ServicioCampo.OrdenesAsignar,
            Permissions.ServicioCampo.OrdenesOperarCampo,
            Permissions.ServicioCampo.OrdenesCerrar,
            Permissions.ServicioCampo.TarifariosGestionar,
            Permissions.ServicioCampo.CatalogosGestionar,

            // También necesita ver y gestionar clientes para el servicio
            Permissions.Crm.Acceso,
            Permissions.Crm.ClientesVer,
            Permissions.Crm.ClientesCrear,
            Permissions.Crm.ClientesEditar,
        },

        // 6. Servicio de Campo: Backoffice / Despacho
        [Roles.ServicioCampoBackoffice] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.ServicioCampo.Acceso,
            Permissions.ServicioCampo.OrdenesVerTodas,
            Permissions.ServicioCampo.OrdenesVerAsignadas,
            Permissions.ServicioCampo.OrdenesCrear,
            Permissions.ServicioCampo.OrdenesAsignar,
            Permissions.ServicioCampo.OrdenesOperarCampo,
            Permissions.ServicioCampo.OrdenesCerrar,

            Permissions.Crm.Acceso,
            Permissions.Crm.ClientesVer,
            Permissions.Crm.ClientesCrear,
            Permissions.Crm.ClientesEditar,
        },

        // 7. Servicio de Campo: Técnico de Campo
        [Roles.ServicioCampoTecnico] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.ServicioCampo.Acceso,
            Permissions.ServicioCampo.OrdenesVerAsignadas,
            Permissions.ServicioCampo.OrdenesOperarCampo,

            Permissions.Crm.Acceso,
            Permissions.Crm.ClientesVer,
        },

        // 8. CRM: Administrador
        [Roles.CrmAdmin] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Crm.Acceso,
            Permissions.Crm.ClientesVer,
            Permissions.Crm.ClientesCrear,
            Permissions.Crm.ClientesEditar,
            Permissions.Crm.ClientesEliminar,
            Permissions.Crm.SegmentacionAvanzada,
        },

        // 9. CRM: Operador
        [Roles.CrmOperador] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Crm.Acceso,
            Permissions.Crm.ClientesVer,
            Permissions.Crm.ClientesCrear,
            Permissions.Crm.ClientesEditar,
        }
    };

    public static bool RoleHasPermission(string role, string permission)
    {
        if (string.Equals(role, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return _rolePermissions.TryGetValue(role, out var permissions) && permissions.Contains(permission);
    }

    public static IReadOnlySet<string> GetPermissionsForRole(string role)
    {
        if (string.Equals(role, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase))
        {
            return new HashSet<string>(Permissions.GetAll(), StringComparer.OrdinalIgnoreCase);
        }

        if (_rolePermissions.TryGetValue(role, out var perms))
        {
            return perms;
        }

        return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    }

    public static IReadOnlySet<string> GetPermissionsForRoles(IEnumerable<string> roles)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var role in roles)
        {
            if (string.Equals(role, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase))
            {
                return new HashSet<string>(Permissions.GetAll(), StringComparer.OrdinalIgnoreCase);
            }

            if (_rolePermissions.TryGetValue(role, out var perms))
            {
                foreach (var p in perms)
                {
                    set.Add(p);
                }
            }
        }
        return set;
    }
}
