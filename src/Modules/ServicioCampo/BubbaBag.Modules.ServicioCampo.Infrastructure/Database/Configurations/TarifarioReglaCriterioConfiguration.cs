using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TarifarioReglaCriterioConfiguration : IEntityTypeConfiguration<TarifarioReglaCriterio>
{
    public void Configure(EntityTypeBuilder<TarifarioReglaCriterio> builder)
    {
        builder.ToTable("TarifarioReglaCriterios", "serviciocampo");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CampoOrdenTrabajo)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.OperadorComparacion)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("IGUAL");

        builder.Property(c => c.ValorEsperado)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(c => new { c.TarifarioReglaId, c.CampoOrdenTrabajo });
    }
}
