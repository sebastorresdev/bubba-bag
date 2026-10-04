using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ResolucionDiferenciaTransferenciaConfiguration : IEntityTypeConfiguration<ResolucionDiferenciaTransferencia>
{
    public void Configure(EntityTypeBuilder<ResolucionDiferenciaTransferencia> builder)
    {
        builder.ToTable("ResolucionDiferenciaTransferencias", "inventario");

        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.OperacionId).IsUnique();

        builder.Property(r => r.TransferenciaId)
            .IsRequired();

        builder.Property(r => r.TransferenciaDetalleId)
            .IsRequired();

        builder.Property(r => r.CantidadAfectada)
            .HasPrecision(18, 5)
            .IsRequired();

        builder.Property(r => r.Resultado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(r => r.Motivo)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(r => r.EvidenciaDocumentaria)
            .HasMaxLength(500);

        builder.Property(r => r.SupervisorId)
            .IsRequired();

        builder.Property(r => r.SupervisorNombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.FechaResolucion)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(r => r.TransferenciaId);
        builder.HasIndex(r => r.TransferenciaDetalleId);
        builder.HasIndex(r => r.FechaResolucion);
    }
}
