using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class LiquidacionMaterialConfiguration : IEntityTypeConfiguration<LiquidacionMaterial>
{
    public void Configure(EntityTypeBuilder<LiquidacionMaterial> builder)
    {
        builder.ToTable("LiquidacionesMaterial", "serviciocampo");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.NumeroLiquidacion)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(l => l.NumeroLiquidacion)
            .IsUnique();

        builder.Property(l => l.Estado)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("Borrador");

        builder.Property(l => l.Observaciones)
            .HasMaxLength(500);

        builder.HasOne(l => l.OrdenTrabajo)
            .WithMany(o => o.LiquidacionesMaterial)
            .HasForeignKey(l => l.OrdenTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Almacen)
            .WithMany()
            .HasForeignKey(l => l.AlmacenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(l => l.Items)
            .WithOne(i => i.LiquidacionMaterial)
            .HasForeignKey(i => i.LiquidacionMaterialId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
