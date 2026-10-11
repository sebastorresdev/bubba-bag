using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class PlantillaTrabajoConfiguration : IEntityTypeConfiguration<PlantillaTrabajo>
{
    public void Configure(EntityTypeBuilder<PlantillaTrabajo> builder)
    {
        builder.ToTable("PlantillasTrabajo", "serviciocampo");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.Codigo)
            .IsUnique();

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(p => p.Descripcion)
            .HasMaxLength(300);

        builder.Property(p => p.DuracionEstimadaMinutos)
            .IsRequired()
            .HasDefaultValue(60);

        builder.Property(p => p.EsPredeterminada)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(p => p.ProductoId)
            .HasColumnName("ServicioId")
            .IsRequired();

        builder.HasOne(p => p.Producto)
            .WithMany()
            .HasForeignKey(p => p.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Servicios)
            .WithOne(s => s.PlantillaTrabajo)
            .HasForeignKey(s => s.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Tareas)
            .WithOne(t => t.PlantillaTrabajo)
            .HasForeignKey(t => t.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Materiales)
            .WithOne(m => m.PlantillaTrabajo)
            .HasForeignKey(m => m.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.Servicios).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(p => p.Tareas).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(p => p.Materiales).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public class PlantillaServicioConfiguration : IEntityTypeConfiguration<PlantillaServicio>
{
    public void Configure(EntityTypeBuilder<PlantillaServicio> builder)
    {
        builder.ToTable("PlantillasServicios", "serviciocampo");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.PlantillaTrabajoId)
            .IsRequired();

        builder.Property(s => s.ProductoId)
            .IsRequired();

        builder.Property(s => s.EsPredeterminada)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne(s => s.PlantillaTrabajo)
            .WithMany(p => p.Servicios)
            .HasForeignKey(s => s.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Producto)
            .WithMany()
            .HasForeignKey(s => s.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => new { s.PlantillaTrabajoId, s.ProductoId })
            .IsUnique();
    }
}
