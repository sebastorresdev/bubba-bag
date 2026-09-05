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

        // Asegurar la existencia de los 4 roles fijos del sistema
        foreach (var rol in BubbaBag.SharedKernel.Authorization.Roles.Fijos)
        {
            if (!await roleManager.RoleExistsAsync(rol))
            {
                await roleManager.CreateAsync(new Rol { Name = rol });
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
