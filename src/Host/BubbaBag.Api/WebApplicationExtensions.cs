using System;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Api;

public static class WebApplicationExtensions
{
    public static async Task ApplyMigrationsAndSeedAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        
        var dbContext = scope.ServiceProvider.GetRequiredService<SeguridadDbContext>();
        await dbContext.Database.MigrateAsync();

        var rrhhDbContext = scope.ServiceProvider.GetRequiredService<BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.RecursosHumanosDbContext>();
        await rrhhDbContext.Database.MigrateAsync();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Rol>>();

        // Asegurar la existencia de los 4 roles fijos del sistema con su descripción oficial
        var rolesFijos = new (string Nombre, string Descripcion)[]
        {
            (BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin, "Desarrollador y administrador técnico global con control total sobre todos los módulos del sistema."),
            (BubbaBag.SharedKernel.Authorization.Roles.Gerencia, "Dirección y jefatura general. Visualización de métricas e información financiera y confidencial."),
            (BubbaBag.SharedKernel.Authorization.Roles.RrhhAdmin, "Administrador de Recursos Humanos. Control total: altas, ceses, contratos, salarios y cuentas bancarias."),
            (BubbaBag.SharedKernel.Authorization.Roles.RrhhAsistente, "Asistente operativo de Recursos Humanos. Gestión de colaboradores y contacto. Sin acceso a salarios ni cuentas bancarias.")
        };

        foreach (var (nombre, descripcion) in rolesFijos)
        {
            var rol = await roleManager.FindByNameAsync(nombre);
            if (rol == null)
            {
                await roleManager.CreateAsync(new Rol { Name = nombre, Descripcion = descripcion });
            }
            else if (string.IsNullOrEmpty(rol.Descripcion) || rol.Descripcion != descripcion)
            {
                rol.Descripcion = descripcion;
                await roleManager.UpdateAsync(rol);
            }
        }

        // Si existía el rol viejo "Admin" de pruebas anteriores, eliminarlo
        var rolViejoAdmin = await roleManager.FindByNameAsync("Admin");
        if (rolViejoAdmin != null)
        {
            await roleManager.DeleteAsync(rolViejoAdmin);
        }

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
            await userManager.AddToRoleAsync(admin, BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin);
        }
        else
        {
            if (!await userManager.IsInRoleAsync(admin, BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin))
            {
                await userManager.AddToRoleAsync(admin, BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin);
            }
        }
    }
}
