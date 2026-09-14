using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class OrdenTrabajoVisitaEvidenciaConfiguration : IEntityTypeConfiguration<OrdenTrabajoVisitaEvidencia>
{
    public void Configure(EntityTypeBuilder<OrdenTrabajoVisitaEvidencia> builder)
    {
        builder.ToTable("OrdenTrabajoVisitaEvidencias", "serviciocampo");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(e => e.Url)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.EsObligatoria)
            .IsRequired();

        builder.Property(e => e.Observaciones)
            .HasMaxLength(500);

        builder.Property(e => e.CoordenadasGps)
            .HasMaxLength(100);

        builder.HasIndex(e => e.OrdenTrabajoVisitaId);
    }
}
