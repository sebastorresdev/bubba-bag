using System;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Seeders;

public static class SeguridadSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<Rol>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<Usuario>>();

        // 1. Sembrar o actualizar los 4 roles fijos del sistema con metadatos para UI estilo Odoo
        var rolesFijos = new (string Nombre, string Modulo, string NombreVisible, string Descripcion)[]
        {
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
            )
        };

        foreach (var (nombre, modulo, nombreVisible, descripcion) in rolesFijos)
        {
            var rol = await roleManager.FindByNameAsync(nombre);
            if (rol == null)
            {
                await roleManager.CreateAsync(new Rol
                {
                    Name = nombre,
                    Modulo = modulo,
                    NombreVisible = nombreVisible,
                    Descripcion = descripcion
                });
            }
            else
            {
                bool modificado = false;
                if (rol.Modulo != modulo) { rol.Modulo = modulo; modificado = true; }
                if (rol.NombreVisible != nombreVisible) { rol.NombreVisible = nombreVisible; modificado = true; }
                if (rol.Descripcion != descripcion) { rol.Descripcion = descripcion; modificado = true; }

                if (modificado)
                {
                    await roleManager.UpdateAsync(rol);
                }
            }
        }

        // 2. Limpieza de rol legado "Admin" si existiera de versiones anteriores
        var rolViejoAdmin = await roleManager.FindByNameAsync("Admin");
        if (rolViejoAdmin != null)
        {
            await roleManager.DeleteAsync(rolViejoAdmin);
        }

        // 3. Sembrar usuario inicial SuperAdmin (Desarrollador)
        var admin = await userManager.FindByEmailAsync("admin@bubbabag.com");
        if (admin == null)
        {
            admin = new Usuario
            {
                UserName = "admin@bubbabag.com",
                Email = "admin@bubbabag.com",
                NombreCompleto = "Desarrollador / SuperAdmin"
            };
            await userManager.CreateAsync(admin, "Admin123!");
            await userManager.AddToRoleAsync(admin, Roles.SuperAdmin);
        }
        else
        {
            if (!await userManager.IsInRoleAsync(admin, Roles.SuperAdmin))
            {
                await userManager.AddToRoleAsync(admin, Roles.SuperAdmin);
            }
        }
    }
}
