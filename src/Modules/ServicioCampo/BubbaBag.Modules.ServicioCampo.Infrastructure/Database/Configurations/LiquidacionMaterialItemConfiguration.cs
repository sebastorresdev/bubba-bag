using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class LiquidacionMaterialItemConfiguration : IEntityTypeConfiguration<LiquidacionMaterialItem>
{
    public void Configure(EntityTypeBuilder<LiquidacionMaterialItem> builder)
    {
        builder.ToTable("LiquidacionesMaterialItems", "serviciocampo");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.CantidadConsumida)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.CantidadDevuelta)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.EsSeriado)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(i => i.NumeroSerie)
            .HasMaxLength(100);

        builder.Property(i => i.EsRetiro)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(i => i.Observaciones)
            .HasMaxLength(500);

        builder.HasOne(i => i.LiquidacionMaterial)
            .WithMany(l => l.Items)
            .HasForeignKey(i => i.LiquidacionMaterialId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Producto)
            .WithMany()
            .HasForeignKey(i => i.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.NumeroSerie);
    }
}
