using System.Collections.Generic;
using System.Reflection;

namespace BubbaBag.SharedKernel.Authorization;

public static class Permissions
{
    // =========================================================================
    // SERVICIO DE CAMPO
    // =========================================================================
    public static class ServicioCampo
    {
        public const string Acceso = "serviciocampo.acceso";
        public const string OrdenesVerTodas = "serviciocampo.ordenes.ver_todas";
        public const string OrdenesVerAsignadas = "serviciocampo.ordenes.ver_asignadas";
        public const string OrdenesCrear = "serviciocampo.ordenes.crear";
        public const string OrdenesAsignar = "serviciocampo.ordenes.asignar";
        public const string OrdenesOperarCampo = "serviciocampo.ordenes.operar_campo";
        public const string OrdenesCerrar = "serviciocampo.ordenes.cerrar";
        public const string TarifariosGestionar = "serviciocampo.tarifarios.gestionar";
        public const string CatalogosGestionar = "serviciocampo.catalogos.gestionar";
    }

    // =========================================================================
    // CRM Y CLIENTES
    // =========================================================================
    public static class Crm
    {
        public const string Acceso = "crm.acceso";
        public const string ClientesVer = "crm.clientes.ver";
        public const string ClientesCrear = "crm.clientes.crear";
        public const string ClientesEditar = "crm.clientes.editar";
        public const string ClientesEliminar = "crm.clientes.eliminar";
        public const string SegmentacionAvanzada = "crm.segmentacion.avanzada"; // Feature Premium
    }

    // =========================================================================
    // RECURSOS HUMANOS
    // =========================================================================
    public static class Rrhh
    {
        public const string Acceso = "rrhh.acceso";
        public const string ColaboradoresVer = "rrhh.colaboradores.ver";
        public const string ColaboradoresGestionar = "rrhh.colaboradores.gestionar";
        public const string SalariosConfidencial = "rrhh.salarios.confidencial";
        public const string CatalogosGestionar = "rrhh.catalogos.gestionar";
    }

    // =========================================================================
    // SEGURIDAD Y SISTEMA
    // =========================================================================
    public static class Seguridad
    {
        public const string Acceso = "seguridad.acceso";
        public const string UsuariosGestionar = "seguridad.usuarios.gestionar";
        public const string RolesGestionar = "seguridad.roles.gestionar";
    }

    /// <summary>
    /// Retorna todos los permisos definidos en el sistema mediante reflexión.
    /// </summary>
    public static IReadOnlyList<string> GetAll()
    {
        var list = new List<string>();
        foreach (var nestedType in typeof(Permissions).GetNestedTypes(BindingFlags.Public | BindingFlags.Static))
        {
            foreach (var field in nestedType.GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy))
            {
                if (field.IsLiteral && !field.IsInitOnly && field.FieldType == typeof(string))
                {
                    var val = (string?)field.GetValue(null);
                    if (!string.IsNullOrEmpty(val))
                    {
                        list.Add(val);
                    }
                }
            }
        }
        return list.AsReadOnly();
    }
}
