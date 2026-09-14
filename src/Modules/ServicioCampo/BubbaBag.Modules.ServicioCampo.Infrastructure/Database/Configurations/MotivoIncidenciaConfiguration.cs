using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class MotivoIncidenciaConfiguration : IEntityTypeConfiguration<MotivoIncidencia>
{
    public void Configure(EntityTypeBuilder<MotivoIncidencia> builder)
    {
        builder.ToTable("MotivosIncidencia", "serviciocampo");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Codigo)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(m => m.Codigo)
            .IsUnique();

        builder.Property(m => m.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(m => m.Descripcion)
            .HasMaxLength(300);

        builder.Property(m => m.Ambito)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(m => m.Ambito);

        builder.Property(m => m.Activo)
            .IsRequired();
    }
}
