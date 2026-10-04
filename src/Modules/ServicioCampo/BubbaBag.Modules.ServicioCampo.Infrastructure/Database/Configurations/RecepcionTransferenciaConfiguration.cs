using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class RecepcionTransferenciaConfiguration : IEntityTypeConfiguration<RecepcionTransferencia>
{
    public void Configure(EntityTypeBuilder<RecepcionTransferencia> builder)
    {
        builder.ToTable("RecepcionesTransferencia", "inventario");

        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.OperacionId).IsUnique();

        builder.Property(r => r.NumeroRecepcion)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.TransferenciaId)
            .IsRequired();

        builder.Property(r => r.FechaRecepcion)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(r => r.RecibidoPorId)
            .IsRequired();

        builder.Property(r => r.RecibidoPorNombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.Observaciones)
            .HasMaxLength(500);

        builder.HasMany(r => r.Lineas)
            .WithOne()
            .HasForeignKey(l => l.RecepcionTransferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.NumeroRecepcion).IsUnique();
        builder.HasIndex(r => r.TransferenciaId);
        builder.HasIndex(r => r.FechaRecepcion);
    }
}
