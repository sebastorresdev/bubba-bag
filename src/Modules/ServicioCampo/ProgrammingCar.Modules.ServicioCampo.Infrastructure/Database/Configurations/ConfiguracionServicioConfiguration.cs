using ProgrammingCar.Modules.ServicioCampo.Domain.Plantillas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ConfiguracionServicioConfiguration : IEntityTypeConfiguration<ConfiguracionServicio>
{
    public void Configure(EntityTypeBuilder<ConfiguracionServicio> builder)
    {
        builder.ToTable("PlantillasTrabajo", "serviciocampo");

        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.ProductoId);

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(p => p.Descripcion)
            .HasMaxLength(300);

        builder.Property(p => p.DuracionEstimadaMinutos)
            .IsRequired()
            .HasDefaultValue(60);

        builder.Property(p => p.SlaHorasResolucion)
            .IsRequired(false);

        builder.Property(p => p.Puntos)
            .IsRequired()
            .HasPrecision(5, 2)
            .HasDefaultValue(1.0m);

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

        builder.HasMany(p => p.Tareas)
            .WithOne(t => t.ConfiguracionServicio)
            .HasForeignKey(t => t.ConfiguracionServicioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Materiales)
            .WithOne(m => m.ConfiguracionServicio)
            .HasForeignKey(m => m.ConfiguracionServicioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.Tareas).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.HasMany(p => p.Servicios)
            .WithOne(s => s.ConfiguracionServicio)
            .HasForeignKey(s => s.ConfiguracionServicioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.Materiales).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(p => p.Servicios).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
