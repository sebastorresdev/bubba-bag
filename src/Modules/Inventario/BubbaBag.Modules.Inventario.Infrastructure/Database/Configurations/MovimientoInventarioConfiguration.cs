using BubbaBag.Modules.Inventario.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.Inventario.Infrastructure.Database.Configurations;

public class MovimientoInventarioConfiguration : IEntityTypeConfiguration<MovimientoInventario>
{
    public void Configure(EntityTypeBuilder<MovimientoInventario> builder)
    {
        builder.ToTable("MovimientosInventario", "inventario");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Tipo)
            .IsRequired()
            .HasConversion<int>();

        builder.HasIndex(m => m.Tipo);

        builder.Property(m => m.Cantidad)
            .IsRequired()
            .HasPrecision(14, 2);

        builder.Property(m => m.NumeroDocumento)
            .HasMaxLength(100);

        builder.HasIndex(m => m.NumeroDocumento);

        builder.Property(m => m.Observaciones)
            .HasMaxLength(500);

        builder.Property(m => m.FechaMovimiento)
            .IsRequired();

        builder.HasIndex(m => m.FechaMovimiento);

        builder.Property(m => m.ClienteId);
        builder.HasIndex(m => m.ClienteId);

        builder.Property(m => m.OrdenTrabajoId);
        builder.HasIndex(m => m.OrdenTrabajoId);

        builder.HasOne(m => m.Producto)
            .WithMany()
            .HasForeignKey(m => m.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.ItemSeriado)
            .WithMany()
            .HasForeignKey(m => m.ItemSeriadoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(m => m.AlmacenOrigen)
            .WithMany()
            .HasForeignKey(m => m.AlmacenOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.AlmacenDestino)
            .WithMany()
            .HasForeignKey(m => m.AlmacenDestinoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
