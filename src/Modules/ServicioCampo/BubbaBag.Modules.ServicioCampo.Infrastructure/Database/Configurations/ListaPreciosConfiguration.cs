using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ListaPreciosConfiguration : IEntityTypeConfiguration<ListaPrecios>
{
    public void Configure(EntityTypeBuilder<ListaPrecios> builder)
    {
        builder.ToTable("ListasPrecios", "inventario");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(l => l.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(l => l.Codigo)
            .IsUnique();

        builder.Property(l => l.Moneda)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("PEN");

        builder.Property(l => l.Descripcion)
            .HasMaxLength(300);

        builder.Property(l => l.FechaInicio)
            .IsRequired(false);

        builder.Property(l => l.FechaFin)
            .IsRequired(false);

        builder.Property(l => l.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasMany(l => l.Elementos)
            .WithOne(e => e.ListaPrecios)
            .HasForeignKey(e => e.ListaPreciosId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
