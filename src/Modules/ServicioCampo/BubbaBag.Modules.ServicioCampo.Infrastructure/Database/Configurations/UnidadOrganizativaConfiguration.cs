using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class UnidadOrganizativaConfiguration : IEntityTypeConfiguration<UnidadOrganizativa>
{
    public void Configure(EntityTypeBuilder<UnidadOrganizativa> builder)
    {
        builder.ToTable("UnidadesOrganizativas", "serviciocampo");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Codigo)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(u => u.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(u => u.Ciudad)
            .HasMaxLength(100);

        builder.Property(u => u.Direccion)
            .HasMaxLength(250);

        builder.Property(u => u.Telefono)
            .HasMaxLength(50);

        builder.Property(u => u.EsSedePrincipal)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(u => u.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(u => u.Codigo).IsUnique();
        builder.HasIndex(u => u.Nombre);
    }
}
