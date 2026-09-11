using BubbaBag.Modules.FieldService.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database.Configurations;

public class OrigenOrdenConfiguration : IEntityTypeConfiguration<OrigenOrden>
{
    public void Configure(EntityTypeBuilder<OrigenOrden> builder)
    {
        builder.ToTable("OrigenesOrden", "fieldservice");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Codigo)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(o => o.Codigo)
            .IsUnique();

        builder.Property(o => o.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.Descripcion)
            .HasMaxLength(250);

        builder.Property(o => o.EsIntegracionExterna)
            .IsRequired();

        builder.Property(o => o.Activo)
            .IsRequired();
    }
}
