using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class CatalogoServicioConfiguration : IEntityTypeConfiguration<CatalogoServicio>
{
    public void Configure(EntityTypeBuilder<CatalogoServicio> builder)
    {
        builder.ToTable("CatalogosServicio", "serviciocampo");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(c => c.Nombre);

        builder.Property(c => c.Descripcion)
            .HasMaxLength(300);

        builder.HasOne(c => c.Cliente)
            .WithMany()
            .HasForeignKey(c => c.ClienteId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.Servicios)
            .WithOne(s => s.CatalogoServicio)
            .HasForeignKey(s => s.CatalogoServicioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
