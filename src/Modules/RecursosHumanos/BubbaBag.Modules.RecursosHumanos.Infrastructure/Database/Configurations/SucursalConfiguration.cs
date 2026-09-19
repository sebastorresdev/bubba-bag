using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class SucursalConfiguration : IEntityTypeConfiguration<Sucursal>
{
    public void Configure(EntityTypeBuilder<Sucursal> builder)
    {
        builder.ToTable("Sucursales", "rrhh");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Codigo)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(s => s.Nombre)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(s => s.Ciudad)
            .HasMaxLength(80);

        builder.Property(s => s.Direccion)
            .HasMaxLength(250);

        builder.Property(s => s.Telefono)
            .HasMaxLength(30);

        builder.Property(s => s.EsSedePrincipal)
            .IsRequired();

        builder.Property(s => s.Activo)
            .IsRequired();

        builder.HasIndex(s => s.Codigo)
            .IsUnique();
    }
}
