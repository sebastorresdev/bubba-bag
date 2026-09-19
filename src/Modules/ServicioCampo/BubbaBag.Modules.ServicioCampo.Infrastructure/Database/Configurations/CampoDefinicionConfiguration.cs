using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class CampoDefinicionConfiguration : IEntityTypeConfiguration<CampoDefinicion>
{
    public void Configure(EntityTypeBuilder<CampoDefinicion> builder)
    {
        builder.ToTable("CamposDefinicion", "serviciocampo");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Clave)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Etiqueta)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.TipoDato)
            .IsRequired();

        builder.Property(c => c.OpcionesJson)
            .HasMaxLength(1000);

        builder.HasIndex(c => new { c.TipoOrdenTrabajoId, c.Clave })
            .IsUnique();
    }
}
