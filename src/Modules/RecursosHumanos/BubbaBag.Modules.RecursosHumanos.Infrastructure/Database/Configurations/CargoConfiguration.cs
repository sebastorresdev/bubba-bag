using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class CargoConfiguration : IEntityTypeConfiguration<Cargo>
{
    public void Configure(EntityTypeBuilder<Cargo> builder)
    {
        builder.ToTable("Cargos", "rrhh");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.SalarioReferencial)
            .HasPrecision(18, 2);

        builder.Property(c => c.Activo)
            .IsRequired();

        builder.HasIndex(c => new { c.DepartamentoId, c.Nombre })
            .IsUnique();
    }
}
