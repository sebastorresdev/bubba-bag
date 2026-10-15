using System.Collections.Generic;
using System.Reflection;

namespace BubbaBag.SharedKernel.Authorization;

public static class Permissions
{
    public static class Configuracion
    {
        public const string EmpresaDatosFiscalesGestionar = "configuracion.empresa.datos_fiscales.gestionar";
        public const string EmpresaPresentacionGestionar = "configuracion.empresa.presentacion.gestionar";
        public const string SucursalesGestionar = "configuracion.sucursales.gestionar";
        public const string SucursalesSedePrincipalGestionar = "configuracion.sucursales.sede_principal.gestionar";
        public const string SucursalesEstadoGestionar = "configuracion.sucursales.estado.gestionar";
    }

    public static class Inventario
    {
        public const string Acceso = "inventario.acceso";
        public const string CatalogosGestionar = "inventario.catalogos.gestionar";
        public const string Operar = "inventario.operar";
        public const string AccesosGestionar = "inventario.accesos.gestionar";
        public const string AjustesAprobar = "inventario.ajustes.aprobar";
    }
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

    public static class GestionDatos
    {
        public const string Importar = "gestiondatos.importar";
        public const string HistorialVer = "gestiondatos.historial.ver";
        public const string HistorialVerTodas = "gestiondatos.historial.ver_otras_personas";
        public const string HistorialEliminar = "gestiondatos.historial.eliminar";
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
