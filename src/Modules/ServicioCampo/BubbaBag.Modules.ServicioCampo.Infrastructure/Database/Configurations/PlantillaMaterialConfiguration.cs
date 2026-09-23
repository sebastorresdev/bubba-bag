using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class PlantillaMaterialConfiguration : IEntityTypeConfiguration<PlantillaMaterial>
{
    public void Configure(EntityTypeBuilder<PlantillaMaterial> builder)
    {
        builder.ToTable("PlantillasMateriales", "serviciocampo");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.CantidadPrevista)
            .IsRequired()
            .HasPrecision(12, 2);

        builder.Property(m => m.EsObligatorio)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(m => m.Observaciones)
            .HasMaxLength(250);

        builder.HasOne(m => m.PlantillaTrabajo)
            .WithMany(p => p.Materiales)
            .HasForeignKey(m => m.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Producto)
            .WithMany()
            .HasForeignKey(m => m.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
