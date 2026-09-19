using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ServicioPasoConfiguration : IEntityTypeConfiguration<ServicioPaso>
{
    public void Configure(EntityTypeBuilder<ServicioPaso> builder)
    {
        builder.ToTable("ServicioPasos", "serviciocampo");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Descripcion)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(p => p.NumeroPaso)
            .IsRequired();

        builder.Property(p => p.TipoEvidencia)
            .IsRequired();

        builder.HasIndex(p => new { p.ServicioId, p.NumeroPaso });
    }
}
