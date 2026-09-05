using System;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Seguridad.Infrastructure.Persistence;

public class SeguridadDbContext : IdentityDbContext<Usuario, Rol, Guid>
{
    public SeguridadDbContext(DbContextOptions<SeguridadDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Configuraciones adicionales de Identity (cambiar nombres de tablas si se desea)
        builder.HasDefaultSchema("seguridad");
    }
}
