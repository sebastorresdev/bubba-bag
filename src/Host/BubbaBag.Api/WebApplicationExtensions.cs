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

        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new Rol { Name = "Admin" });
        }

        if (await userManager.FindByEmailAsync("admin@bubbabag.com") == null)
        {
            var admin = new Usuario 
            { 
                UserName = "admin@bubbabag.com", 
                Email = "admin@bubbabag.com", 
                NombreCompleto = "Administrador del Sistema" 
            };
            await userManager.CreateAsync(admin, "Admin123!");
            await userManager.AddToRoleAsync(admin, "Admin");
        }
    }
}
