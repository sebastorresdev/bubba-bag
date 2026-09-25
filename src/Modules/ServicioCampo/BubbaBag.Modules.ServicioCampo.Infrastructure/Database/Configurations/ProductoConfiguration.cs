using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

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

        builder.Property(p => p.Tipo)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(p => p.PrecioBase)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(p => p.CatalogoId)
            .IsRequired(false);

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

        builder.Property(p => p.ConvertirEnActivoCliente)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.CodigoBarras)
            .HasMaxLength(50);

        builder.Property(p => p.Notas)
            .HasMaxLength(1000);

        builder.Property(p => p.CostoActual)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(p => p.CostoEstandar)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(p => p.AfectoImpuesto)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(p => p.ProveedorDefecto)
            .HasMaxLength(150);

        builder.Property(p => p.Activo)
            .IsRequired();
    }
}
