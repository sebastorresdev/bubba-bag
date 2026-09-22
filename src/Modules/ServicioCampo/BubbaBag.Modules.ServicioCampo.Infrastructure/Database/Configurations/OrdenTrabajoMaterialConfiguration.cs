using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class OrdenTrabajoMaterialConfiguration : IEntityTypeConfiguration<OrdenTrabajoMaterial>
{
    public void Configure(EntityTypeBuilder<OrdenTrabajoMaterial> builder)
    {
        builder.ToTable("OrdenTrabajoMateriales", "serviciocampo");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Cantidad)
            .IsRequired()
            .HasPrecision(14, 2);

        builder.Property(m => m.ItemSeriadoId);
        builder.HasIndex(m => m.ItemSeriadoId);

        builder.Property(m => m.NumeroSerie)
            .HasMaxLength(100);

        builder.HasIndex(m => m.NumeroSerie);

        builder.Property(m => m.NumeroSmartCard)
            .HasMaxLength(100);

        builder.HasIndex(m => m.NumeroSmartCard);

        builder.Property(m => m.EsRetiro)
            .IsRequired();

        builder.Property(m => m.Observaciones)
            .HasMaxLength(500);

        builder.Property(m => m.FechaRegistro)
            .IsRequired();

        builder.HasIndex(m => m.FechaRegistro);

        builder.HasOne(m => m.OrdenTrabajo)
            .WithMany(o => o.Materiales)
            .HasForeignKey(m => m.OrdenTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.OrdenTrabajoVisita)
            .WithMany()
            .HasForeignKey(m => m.OrdenTrabajoVisitaId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
