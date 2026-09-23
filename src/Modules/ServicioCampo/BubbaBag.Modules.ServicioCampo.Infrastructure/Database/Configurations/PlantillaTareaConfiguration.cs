using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class PlantillaTareaConfiguration : IEntityTypeConfiguration<PlantillaTarea>
{
    public void Configure(EntityTypeBuilder<PlantillaTarea> builder)
    {
        builder.ToTable("PlantillasTareas", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.OrdenSecuencia)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(t => t.EsObligatoria)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(t => t.RequiereEvidencia)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(t => t.Instrucciones)
            .HasMaxLength(500);

        builder.HasOne(t => t.PlantillaTrabajo)
            .WithMany(p => p.Tareas)
            .HasForeignKey(t => t.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Tarea)
            .WithMany()
            .HasForeignKey(t => t.TareaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
