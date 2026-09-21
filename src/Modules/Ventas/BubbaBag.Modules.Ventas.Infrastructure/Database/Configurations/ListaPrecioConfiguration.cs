using BubbaBag.Modules.Ventas.Domain.ListasPrecio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.Ventas.Infrastructure.Database.Configurations;

public class ListaPrecioConfiguration : IEntityTypeConfiguration<ListaPrecio>
{
    public void Configure(EntityTypeBuilder<ListaPrecio> builder)
    {
        builder.ToTable("ListasPrecio", "ventas");

        builder.HasKey(lp => lp.Id);

        builder.Property(lp => lp.Codigo)
            .HasMaxLength(50);

        builder.Property(lp => lp.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(lp => lp.Moneda)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("PEN");

        builder.Property(lp => lp.Descripcion)
            .HasMaxLength(300);

        builder.Property(lp => lp.EsPredeterminada)
            .IsRequired();

        builder.Property(lp => lp.Activo)
            .IsRequired();

        builder.Property(lp => lp.EntidadComercialId)
            .HasColumnName("ClienteId");

        builder.Ignore(lp => lp.ClienteId);
        builder.Ignore(lp => lp.CatalogosAsociadosIds);

        builder.HasMany(lp => lp.Items)
            .WithOne()
            .HasForeignKey(i => i.ListaPrecioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
