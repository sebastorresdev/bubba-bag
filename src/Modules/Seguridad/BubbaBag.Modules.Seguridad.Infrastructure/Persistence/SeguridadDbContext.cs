using System;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Seguridad.Infrastructure.Persistence;

public class SeguridadDbContext : IdentityDbContext<Usuario, Rol, Guid>
{
    public DbSet<VistaUsuario> VistasUsuario => Set<VistaUsuario>();
    public DbSet<UsuarioZonaOperativa> UsuariosZonasOperativas => Set<UsuarioZonaOperativa>();
    public DbSet<UsuarioAlmacen> UsuariosAlmacenes => Set<UsuarioAlmacen>();

    public SeguridadDbContext(DbContextOptions<SeguridadDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Configuraciones adicionales de Identity (cambiar nombres de tablas si se desea)
        builder.HasDefaultSchema("seguridad");

        builder.Entity<VistaUsuario>(entity =>
        {
            entity.ToTable("VistasUsuario");
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Entidad).HasMaxLength(100).IsRequired();
            entity.Property(v => v.Nombre).HasMaxLength(150).IsRequired();
            entity.Property(v => v.Descripcion).HasMaxLength(500);
            entity.Property(v => v.ConfiguracionJson).HasColumnType("text");

            entity.HasOne(v => v.Usuario)
                .WithMany()
                .HasForeignKey(v => v.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(v => new { v.UsuarioId, v.Entidad });
            entity.HasIndex(v => new { v.UsuarioId, v.Entidad, v.EsPredeterminada });
        });

        builder.Entity<UsuarioZonaOperativa>(entity =>
        {
            entity.ToTable("UsuariosZonasOperativas");
            entity.HasKey(u => u.Id);

            entity.HasOne(u => u.Usuario)
                .WithMany()
                .HasForeignKey(u => u.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(u => new { u.UsuarioId, u.ZonaOperativaId }).IsUnique();
        });

        builder.Entity<UsuarioAlmacen>(entity =>
        {
            entity.ToTable("UsuariosAlmacenes");
            entity.HasKey(u => u.Id);

            entity.HasOne(u => u.Usuario)
                .WithMany()
                .HasForeignKey(u => u.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(u => new { u.UsuarioId, u.AlmacenId }).IsUnique();
        });
    }
}
