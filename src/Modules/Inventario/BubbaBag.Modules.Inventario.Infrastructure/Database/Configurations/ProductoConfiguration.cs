using BubbaBag.Modules.Inventario.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.Inventario.Infrastructure.Database.Configurations;

public class ProductoConfiguration : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> builder)
    {
        builder.ToTable("Productos", "inventario");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.Codigo)
            .IsUnique();

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(p => p.Categoria)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.UnidadMedida)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(p => p.Descripcion)
            .HasMaxLength(300);

        builder.Property(p => p.EsSerializado)
            .IsRequired();

        builder.Property(p => p.Activo)
            .IsRequired();
    }
}
