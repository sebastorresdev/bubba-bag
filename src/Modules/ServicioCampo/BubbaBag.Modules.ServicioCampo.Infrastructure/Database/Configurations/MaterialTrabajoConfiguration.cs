using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class MaterialTrabajoConfiguration : IEntityTypeConfiguration<MaterialTrabajo>
{
    public void Configure(EntityTypeBuilder<MaterialTrabajo> builder)
    {
        builder.ToTable("MaterialesTrabajo", "serviciocampo");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.CantidadPrevista)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(m => m.CantidadUtilizada)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(m => m.EsSeriado)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(m => m.NumeroSerie)
            .HasMaxLength(100);

        builder.Property(m => m.NumeroSmartCard)
            .HasMaxLength(100);

        builder.Property(m => m.EsRetiro)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(m => m.Observaciones)
            .HasMaxLength(500);

        builder.HasOne(m => m.Trabajo)
            .WithMany(t => t.Materiales)
            .HasForeignKey(m => m.TrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Producto)
            .WithMany()
            .HasForeignKey(m => m.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.NumeroSerie);
    }
}
