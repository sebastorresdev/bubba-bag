using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ElementoListaPreciosConfiguration : IEntityTypeConfiguration<ElementoListaPrecios>
{
    public void Configure(EntityTypeBuilder<ElementoListaPrecios> builder)
    {
        builder.ToTable("ElementosListaPrecios", "inventario");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.ListaPreciosId)
            .IsRequired();

        builder.Property(e => e.ProductoId)
            .IsRequired();

        builder.Property(e => e.UnidadMedidaId)
            .IsRequired(false);

        builder.Property(e => e.Monto)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(e => e.MetodoFijacion)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(MetodoFijacionPrecio.ImporteDivisa);

        builder.HasOne(e => e.ListaPrecios)
            .WithMany(l => l.Elementos)
            .HasForeignKey(e => e.ListaPreciosId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Producto)
            .WithMany(p => p.PreciosEnListas)
            .HasForeignKey(e => e.ProductoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.UnidadMedida)
            .WithMany()
            .HasForeignKey(e => e.UnidadMedidaId)
            .OnDelete(DeleteBehavior.SetNull);

        // Índice compuesto para evitar duplicados del mismo producto y unidad en una misma lista
        builder.HasIndex(e => new { e.ListaPreciosId, e.ProductoId, e.UnidadMedidaId })
            .IsUnique();
    }
}
