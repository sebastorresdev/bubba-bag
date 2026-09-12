using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TarifarioReglaConfiguration : IEntityTypeConfiguration<TarifarioRegla>
{
    public void Configure(EntityTypeBuilder<TarifarioRegla> builder)
    {
        builder.ToTable("TarifarioReglas", "serviciocampo");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.NombreRegla)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.MontoTarifaBase)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(r => r.AplicaBonoIndicador)
            .IsRequired();

        builder.Property(r => r.Prioridad)
            .IsRequired()
            .HasDefaultValue(10);

        builder.HasOne(r => r.TipoTareaServicio)
            .WithMany()
            .HasForeignKey(r => r.TipoTareaServicioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Criterios)
            .WithOne(c => c.TarifarioRegla)
            .HasForeignKey(c => c.TarifarioReglaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
