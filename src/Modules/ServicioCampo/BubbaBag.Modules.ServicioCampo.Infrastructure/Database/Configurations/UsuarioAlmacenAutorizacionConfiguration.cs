using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class UsuarioAlmacenAutorizacionConfiguration : IEntityTypeConfiguration<UsuarioAlmacenAutorizacion>
{
    public void Configure(EntityTypeBuilder<UsuarioAlmacenAutorizacion> builder)
    {
        builder.ToTable("UsuarioAlmacenAutorizaciones", "inventario");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.UsuarioId)
            .IsRequired();

        builder.Property(a => a.AlmacenId)
            .IsRequired();

        builder.Property(a => a.PuedeConsultar)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.PuedeDespachar)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.PuedeRecepcionar)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.EsSupervisor)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(a => new { a.UsuarioId, a.AlmacenId }).IsUnique();
        builder.HasIndex(a => a.AlmacenId);
    }
}
