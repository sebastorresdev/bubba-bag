using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TransferenciaDetalleConfiguration : IEntityTypeConfiguration<TransferenciaDetalle>
{
    public void Configure(EntityTypeBuilder<TransferenciaDetalle> builder)
    {
        builder.ToTable("TransferenciaDetalles", "inventario");

        builder.HasKey(d => d.Id);
        builder.Property(d=>d.UnidadMedidaNombre).HasMaxLength(100);
        builder.Property<uint>("xmin").IsRowVersion();

        builder.Property(d => d.TransferenciaId)
            .IsRequired();

        builder.Property(d => d.ProductoId)
            .IsRequired();

        builder.Property(d => d.CantidadEnviada)
            .HasPrecision(18, 5)
            .IsRequired();

        builder.Property(d => d.CantidadRecibida)
            .HasPrecision(18, 5)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(d => d.CantidadResuelta)
            .HasPrecision(18, 5)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Ignore(d => d.CantidadPendiente);

        builder.HasMany(d => d.Series)
            .WithOne()
            .HasForeignKey(s => s.TransferenciaDetalleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.TransferenciaId);
        builder.HasIndex(d => d.ProductoId);
    }
}
