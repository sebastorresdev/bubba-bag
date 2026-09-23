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

        builder.HasOne(p => p.Servicio)
            .WithMany(s => s.Plantillas)
            .HasForeignKey(p => p.ServicioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Tareas)
            .WithOne(t => t.PlantillaTrabajo)
            .HasForeignKey(t => t.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Materiales)
            .WithOne(m => m.PlantillaTrabajo)
            .HasForeignKey(m => m.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
