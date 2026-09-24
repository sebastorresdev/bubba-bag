using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class UnidadMedidaConfiguration : IEntityTypeConfiguration<UnidadMedida>
{
    public void Configure(EntityTypeBuilder<UnidadMedida> builder)
    {
        builder.ToTable("UnidadesMedida", "inventario");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Codigo)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(u => u.Codigo)
            .IsUnique();

        builder.Property(u => u.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Abreviatura)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(u => u.PermiteDecimales)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(u => u.Descripcion)
            .HasMaxLength(300);

        builder.Property(u => u.Activo)
            .IsRequired();
    }
}
