using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class RecepcionTransferenciaDetalleConfiguration : IEntityTypeConfiguration<RecepcionTransferenciaDetalle>
{
    public void Configure(EntityTypeBuilder<RecepcionTransferenciaDetalle> builder)
    {
        builder.ToTable("RecepcionTransferenciaDetalles", "inventario");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.RecepcionTransferenciaId)
            .IsRequired();

        builder.Property(d => d.TransferenciaDetalleId)
            .IsRequired();

        builder.Property(d => d.ProductoId)
            .IsRequired();

        builder.Property(d => d.CantidadAceptada)
            .HasPrecision(18, 5)
            .IsRequired();

        builder.Property(d => d.SeriesAceptadasJson);

        builder.HasIndex(d => d.RecepcionTransferenciaId);
        builder.HasIndex(d => d.TransferenciaDetalleId);
        builder.HasIndex(d => d.ProductoId);
    }
}
