using BubbaBag.Modules.FieldService.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database.Configurations;

public class TarifarioReglaCriterioConfiguration : IEntityTypeConfiguration<TarifarioReglaCriterio>
{
    public void Configure(EntityTypeBuilder<TarifarioReglaCriterio> builder)
    {
        builder.ToTable("TarifarioReglaCriterios", "fieldservice");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CampoWorkOrder)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.OperadorComparacion)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("IGUAL");

        builder.Property(c => c.ValorEsperado)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(c => new { c.TarifarioReglaId, c.CampoWorkOrder });
    }
}
