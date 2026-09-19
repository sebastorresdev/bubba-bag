using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ServicioMaterialConfiguration : IEntityTypeConfiguration<ServicioMaterial>
{
    public void Configure(EntityTypeBuilder<ServicioMaterial> builder)
    {
        builder.ToTable("ServicioMateriales", "serviciocampo");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.CantidadTeorica)
            .HasPrecision(12, 2)
            .IsRequired();

        builder.Property(m => m.UnidadMedida)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(m => new { m.ServicioId, m.ProductoId });
    }
}
