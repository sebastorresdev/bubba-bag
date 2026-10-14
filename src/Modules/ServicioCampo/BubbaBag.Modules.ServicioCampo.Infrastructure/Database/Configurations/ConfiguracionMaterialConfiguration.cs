using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ConfiguracionMaterialConfiguration : IEntityTypeConfiguration<ConfiguracionMaterial>
{
    public void Configure(EntityTypeBuilder<ConfiguracionMaterial> builder)
    {
        builder.ToTable("PlantillasMateriales", "serviciocampo");

        builder.Property(x => x.ConfiguracionServicioId).HasColumnName("PlantillaTrabajoId");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.CantidadPrevista)
            .IsRequired()
            .HasPrecision(14, 5);

        builder.Property(m => m.EsObligatorio)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(m => m.Observaciones)
            .HasMaxLength(250);

        builder.HasOne(m => m.ConfiguracionServicio)
            .WithMany(p => p.Materiales)
            .HasForeignKey(m => m.ConfiguracionServicioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Producto)
            .WithMany()
            .HasForeignKey(m => m.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(m => m.UnidadMedidaId)
            .IsRequired(false);

        builder.HasOne(m => m.UnidadMedida)
            .WithMany()
            .HasForeignKey(m => m.UnidadMedidaId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}
