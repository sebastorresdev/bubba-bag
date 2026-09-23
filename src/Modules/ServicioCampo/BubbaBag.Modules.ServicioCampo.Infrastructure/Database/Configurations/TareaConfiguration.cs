using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TareaConfiguration : IEntityTypeConfiguration<Tarea>
{
    public void Configure(EntityTypeBuilder<Tarea> builder)
    {
        builder.ToTable("Tareas", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(t => t.Codigo)
            .IsUnique();

        builder.Property(t => t.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.Descripcion)
            .HasMaxLength(300);

        builder.Property(t => t.DuracionEstimadaMinutos)
            .IsRequired()
            .HasDefaultValue(15);

        builder.Property(t => t.RequiereEvidenciaFotografica)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(t => t.Activo)
            .IsRequired()
            .HasDefaultValue(true);
    }
}
