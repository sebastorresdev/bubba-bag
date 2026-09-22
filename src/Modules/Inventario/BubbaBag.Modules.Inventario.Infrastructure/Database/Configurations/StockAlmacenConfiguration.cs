using BubbaBag.Modules.Inventario.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.Inventario.Infrastructure.Database.Configurations;

public class StockAlmacenConfiguration : IEntityTypeConfiguration<StockAlmacen>
{
    public void Configure(EntityTypeBuilder<StockAlmacen> builder)
    {
        builder.ToTable("StocksAlmacen", "inventario");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.CantidadDisponible)
            .IsRequired()
            .HasPrecision(14, 2);

        builder.Property(s => s.CantidadReservada)
            .IsRequired()
            .HasPrecision(14, 2);

        builder.HasIndex(s => new { s.AlmacenId, s.ProductoId })
            .IsUnique();

        builder.HasOne(s => s.Almacen)
            .WithMany()
            .HasForeignKey(s => s.AlmacenId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Producto)
            .WithMany()
            .HasForeignKey(s => s.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
