using BubbaBag.Modules.Ventas.Domain.ListasPrecio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.Ventas.Infrastructure.Database.Configurations;

public class ListaPrecioItemConfiguration : IEntityTypeConfiguration<ListaPrecioItem>
{
    public void Configure(EntityTypeBuilder<ListaPrecioItem> builder)
    {
        builder.ToTable("ListasPrecioItems", "ventas");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.ProductoComercialId)
            .HasColumnName("ProductoId")
            .IsRequired();

        builder.Property(i => i.PrecioUnitario)
            .IsRequired()
            .HasPrecision(12, 2);

        builder.Ignore(i => i.ProductoId);

        builder.HasIndex(i => new { i.ListaPrecioId, i.ProductoComercialId })
            .IsUnique();
    }
}
