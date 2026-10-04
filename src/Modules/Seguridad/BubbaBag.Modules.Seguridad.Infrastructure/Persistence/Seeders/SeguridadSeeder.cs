using System;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Seeders;

public static class CatalogoRolesSistema
{
    public static async Task AsegurarAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<Rol>>();

        // Catálogo técnico de autorización. No crea usuarios ni datos operativos.
        var rolesFijos = new (string Nombre, string Modulo, string NombreVisible, string Descripcion)[]
        {
            (Roles.InventarioAdmin, "Inventario", "Administrador de inventario", "Gestiona catálogos y autorizaciones. Los movimientos requieren alcance explícito por almacén."),
            (Roles.InventarioAlmacenero, "Inventario", "Almacenero", "Consulta, despacho y recepción exclusivamente en los almacenes autorizados."),
            (
                Roles.SuperAdmin,
                "Sistema",
                "Super Administrador",
                "Desarrollador y administrador técnico global con control total sobre todos los módulos del sistema."
            ),
            (
                Roles.Gerencia,
                "Sistema",
                "Gerencia General",
                "Dirección y jefatura general. Visualización de métricas e información financiera y confidencial."
            ),
            (
                Roles.RrhhAdmin,
                "Recursos Humanos",
                "Administrador",
                "Control total sobre el personal: altas, ceses, contratos, salarios y cuentas bancarias."
            ),
            (
                Roles.RrhhAsistente,
                "Recursos Humanos",
                "Asistente",
                "Gestión operativa de colaboradores y contacto. Sin acceso a salarios ni cuentas bancarias."
            ),
            (
                Roles.ServicioCampoAdmin,
                "Servicio de Campo",
                "Administrador",
                "Control total de operaciones técnicas, despacho, tarifarios y liquidaciones de órdenes de trabajo."
            ),
            (
                Roles.ServicioCampoBackoffice,
                "Servicio de Campo",
                "Backoffice / Despacho",
                "Mesa de ayuda, importación de órdenes externas, agendamiento y asignación a cuadrillas."
            ),
            (
                Roles.ServicioCampoTecnico,
                "Servicio de Campo",
                "Técnico de Campo",
                "Visitas en sitio, registro de evidencias fotográficas, firma de cliente y cierre de órdenes."
            ),
            (
                Roles.CrmAdmin,
                "CRM y Clientes",
                "Administrador",
                "Gestión total del directorio maestro de clientes, segmentación comercial y parametrización."
            ),
            (
                Roles.CrmOperador,
                "CRM y Clientes",
                "Operador",
                "Consulta, registro y actualización básica de clientes en el directorio comercial."
            )
        };

        foreach (var (nombre, modulo, nombreVisible, descripcion) in rolesFijos)
        {
            var rol = await roleManager.FindByNameAsync(nombre);
            if (rol == null)
            {
                var resultado = await roleManager.CreateAsync(new Rol
                {
                    Name = nombre,
                    Modulo = modulo,
                    NombreVisible = nombreVisible,
                    Descripcion = descripcion
                });
                if (!resultado.Succeeded) throw new InvalidOperationException(string.Join(", ", resultado.Errors.Select(e => e.Description)));
            }
            else
            {
                bool modificado = false;
                if (rol.Modulo != modulo) { rol.Modulo = modulo; modificado = true; }
                if (rol.NombreVisible != nombreVisible) { rol.NombreVisible = nombreVisible; modificado = true; }
                if (rol.Descripcion != descripcion) { rol.Descripcion = descripcion; modificado = true; }

                if (modificado)
                {
                    var resultado = await roleManager.UpdateAsync(rol);
                    if (!resultado.Succeeded) throw new InvalidOperationException(string.Join(", ", resultado.Errors.Select(e => e.Description)));
                }
            }
        }

    }
}
