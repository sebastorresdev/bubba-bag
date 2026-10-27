using ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class MotivoRetiroEquipoConfiguration : IEntityTypeConfiguration<MotivoRetiroEquipo>
{
    public void Configure(EntityTypeBuilder<MotivoRetiroEquipo> builder)
    {
        builder.ToTable("MotivosRetiroEquipo", "serviciocampo");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(m => m.Nombre);

        builder.Property(m => m.TipoRetiro)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(m => m.TipoRetiro);

        builder.Property(m => m.Descripcion)
            .HasMaxLength(400);

        builder.Property(m => m.Activo)
            .IsRequired();

        builder.Property(m => m.CreatedAt)
            .IsRequired();

        builder.Property(m => m.UpdatedAt);
    }
}
