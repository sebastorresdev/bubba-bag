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

        builder.Property(a => a.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(a => a.Descripcion)
            .HasMaxLength(500);

        builder.Property(a => a.Tipo)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(TipoAlmacen.Bodega);

        builder.Property(a => a.UnidadOrganizativaId)
            .IsRequired(false);

        builder.Property(a => a.RecursoId)
            .IsRequired(false);

        builder.Property(a => a.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(a => a.CreadoPorNombre)
            .HasMaxLength(150);

        builder.HasIndex(a => a.Codigo);
        builder.HasIndex(a => a.Tipo);
        builder.HasIndex(a => a.UnidadOrganizativaId);
        builder.HasIndex(a => a.RecursoId).IsUnique().HasFilter("\"Tipo\" = 2 AND \"Activo\" = true");
        builder.HasIndex(a => a.CreadoPorId);
        builder.HasIndex(a => a.ActualizadoPorId);
    }
}
