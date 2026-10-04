using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TransferenciaDetalleSerieConfiguration : IEntityTypeConfiguration<TransferenciaDetalleSerie>
{
    public void Configure(EntityTypeBuilder<TransferenciaDetalleSerie> builder)
    {
        builder.ToTable("TransferenciaDetalleSeries", "inventario");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.TransferenciaDetalleId)
            .IsRequired();

        builder.Property(s => s.ItemSeriadoId)
            .IsRequired();

        builder.Property(s => s.NumeroSerie)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Recibida)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.TieneIncidencia)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.MotivoIncidencia)
            .HasMaxLength(250);

        builder.HasOne<RecepcionTransferenciaDetalle>().WithMany().HasForeignKey(s=>s.RecepcionDetalleId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<ResolucionDiferenciaTransferencia>().WithMany().HasForeignKey(s=>s.ResolucionId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(s=>new{s.TransferenciaDetalleId,s.ItemSeriadoId}).IsUnique();
        builder.HasIndex(s => s.TransferenciaDetalleId);
        builder.HasIndex(s => s.NumeroSerie);
    }
}
