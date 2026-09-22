using BubbaBag.Modules.Inventario.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.Inventario.Infrastructure.Database.Configurations;

public class ItemSeriadoConfiguration : IEntityTypeConfiguration<ItemSeriado>
{
    public void Configure(EntityTypeBuilder<ItemSeriado> builder)
    {
        builder.ToTable("ItemsSeriados", "inventario");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.NumeroSerie)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(i => i.NumeroSerie)
            .IsUnique();

        builder.Property(i => i.NumeroSmartCard)
            .HasMaxLength(100);

        builder.HasIndex(i => i.NumeroSmartCard);

        builder.Property(i => i.MacAddress)
            .HasMaxLength(50);

        builder.HasIndex(i => i.MacAddress);

        builder.Property(i => i.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.HasIndex(i => i.Estado);

        builder.Property(i => i.ClienteActualId);
        builder.HasIndex(i => i.ClienteActualId);

        builder.Property(i => i.OrdenTrabajoInstalacionId);
        builder.HasIndex(i => i.OrdenTrabajoInstalacionId);

        builder.Property(i => i.Observaciones)
            .HasMaxLength(500);

        builder.HasOne(i => i.Producto)
            .WithMany()
            .HasForeignKey(i => i.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.AlmacenActual)
            .WithMany()
            .HasForeignKey(i => i.AlmacenActualId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
