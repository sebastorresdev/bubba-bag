using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class StockAlmacenConfiguration : IEntityTypeConfiguration<StockAlmacen>
{
    public void Configure(EntityTypeBuilder<StockAlmacen> builder)
    {
        builder.ToTable("StocksAlmacen", "inventario");

        builder.HasKey(s => s.Id);
        builder.Property<uint>("xmin").IsRowVersion();

        builder.Property(s => s.CantidadDisponible)
            .IsRequired()
            .HasPrecision(14, 5);

        builder.Property(s => s.CantidadReservada)
            .IsRequired()
            .HasPrecision(14, 5);

        builder.HasIndex(s => new { s.UbicacionId, s.ProductoId, s.Condicion })
            .IsUnique();

        builder.HasOne(s => s.Ubicacion)
            .WithMany()
            .HasForeignKey(s => s.UbicacionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Producto)
            .WithMany()
            .HasForeignKey(s => s.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
