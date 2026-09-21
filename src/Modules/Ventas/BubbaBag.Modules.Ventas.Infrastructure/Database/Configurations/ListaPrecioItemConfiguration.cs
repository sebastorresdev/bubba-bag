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

        builder.Property(i => i.PrecioUnitario)
            .IsRequired()
            .HasPrecision(12, 2);

        builder.HasIndex(i => new { i.ListaPrecioId, i.ProductoId })
            .IsUnique();
    }
}
