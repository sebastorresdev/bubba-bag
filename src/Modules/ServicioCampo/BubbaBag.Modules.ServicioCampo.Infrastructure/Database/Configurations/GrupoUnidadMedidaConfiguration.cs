using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class GrupoUnidadMedidaConfiguration : IEntityTypeConfiguration<GrupoUnidadMedida>
{
    public void Configure(EntityTypeBuilder<GrupoUnidadMedida> builder)
    {
        builder.ToTable("GruposUnidadMedida", "inventario");

        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).ValueGeneratedNever();

        builder.Property(g => g.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(g => g.Observacion)
            .HasMaxLength(500);

        builder.HasIndex(g => g.Nombre)
            .IsUnique();

        builder.Property(g => g.EstaActivo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(g => g.FechaCreacion)
            .IsRequired();

        builder.Property(g => g.FechaModificacion)
            .IsRequired(false);

        // 1:N — Un grupo tiene muchas unidades de medida
        builder.HasMany(g => g.Unidades)
            .WithOne(u => u.GrupoUnidadMedida)
            .HasForeignKey(u => u.GrupoUnidadMedidaId)
            .OnDelete(DeleteBehavior.Restrict); // No borrar grupos con unidades asociadas
    }
}
