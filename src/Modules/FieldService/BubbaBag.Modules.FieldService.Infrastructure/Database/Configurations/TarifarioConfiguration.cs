using BubbaBag.Modules.FieldService.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database.Configurations;

public class TarifarioConfiguration : IEntityTypeConfiguration<Tarifario>
{
    public void Configure(EntityTypeBuilder<Tarifario> builder)
    {
        builder.ToTable("Tarifarios", "fieldservice");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(t => t.Codigo)
            .IsUnique();

        builder.Property(t => t.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.Moneda)
            .IsRequired()
            .HasMaxLength(5)
            .HasDefaultValue("PEN");

        builder.Property(t => t.FechaVigenciaDesde)
            .IsRequired();

        builder.Property(t => t.Activo)
            .IsRequired();

        builder.HasIndex(t => new { t.ClienteFacturacionId, t.FechaVigenciaDesde, t.FechaVigenciaHasta });

        builder.HasOne(t => t.ClienteFacturacion)
            .WithMany()
            .HasForeignKey(t => t.ClienteFacturacionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Reglas)
            .WithOne(r => r.Tarifario)
            .HasForeignKey(r => r.TarifarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
