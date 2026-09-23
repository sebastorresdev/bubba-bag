using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class AlmacenConfiguration : IEntityTypeConfiguration<Almacen>
{
    public void Configure(EntityTypeBuilder<Almacen> builder)
    {
        builder.ToTable("Almacenes", "inventario");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(a => a.Codigo)
            .IsUnique();

        builder.Property(a => a.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(a => a.Tipo)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.Direccion)
            .HasMaxLength(250);

        builder.Property(a => a.Telefono)
            .HasMaxLength(50);

        builder.Property(a => a.SucursalId);
        builder.HasIndex(a => a.SucursalId);

        builder.Property(a => a.RecursoTecnicoId);
        builder.HasIndex(a => a.RecursoTecnicoId);

        builder.Property(a => a.Activo)
            .IsRequired()
            .HasDefaultValue(true);
    }
}
