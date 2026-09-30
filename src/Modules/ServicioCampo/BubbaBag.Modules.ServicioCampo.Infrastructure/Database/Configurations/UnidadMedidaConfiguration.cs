using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class UnidadMedidaConfiguration : IEntityTypeConfiguration<UnidadMedida>
{
    public void Configure(EntityTypeBuilder<UnidadMedida> builder)
    {
        builder.ToTable("UnidadesMedida", "inventario");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever();

        builder.Property(u => u.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        // Nombre único dentro del mismo grupo
        builder.HasIndex(u => new { u.GrupoUnidadMedidaId, u.Nombre })
            .IsUnique();

        // Solo una unidad base por grupo
        builder.HasIndex(u => new { u.GrupoUnidadMedidaId, u.EsUnidadBase })
            .IsUnique()
            .HasFilter("\"EsUnidadBase\" = true");

        builder.Property(u => u.EsUnidadBase)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(u => u.UnidadMedidaBaseId)
            .IsRequired(false);

        builder.Property(u => u.Cantidad)
            .IsRequired()
            .HasPrecision(18, 4)
            .HasDefaultValue(1m);

        builder.Property(u => u.FactorConversionTotal)
            .IsRequired()
            .HasPrecision(18, 4)
            .HasDefaultValue(1m);

        builder.Property(u => u.EstaActivo)
            .IsRequired()
            .HasDefaultValue(true);

        // Autorreferencia: unidad derivada → unidad base (nullable)
        builder.HasOne(u => u.UnidadMedidaBase)
            .WithMany()
            .HasForeignKey(u => u.UnidadMedidaBaseId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // FK hacia el grupo (configurada desde GrupoUnidadMedidaConfiguration)
        builder.HasOne(u => u.GrupoUnidadMedida)
            .WithMany(g => g.Unidades)
            .HasForeignKey(u => u.GrupoUnidadMedidaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
