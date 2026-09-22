using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ZonaOperativaConfiguration : IEntityTypeConfiguration<ZonaOperativa>
{
    public void Configure(EntityTypeBuilder<ZonaOperativa> builder)
    {
        builder.ToTable("ZonasOperativas", "serviciocampo");

        builder.HasKey(z => z.Id);

        builder.Property(z => z.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(z => z.Codigo)
            .IsUnique();

        builder.Property(z => z.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(z => z.DescripcionProveedor)
            .HasMaxLength(250);

        builder.Property(z => z.SucursalId)
            .IsRequired();
        builder.HasIndex(z => z.SucursalId);

        builder.Property(z => z.AlmacenPredeterminadoId);
        builder.HasIndex(z => z.AlmacenPredeterminadoId);

        builder.Property(z => z.Activo)
            .IsRequired()
            .HasDefaultValue(true);
    }
}
