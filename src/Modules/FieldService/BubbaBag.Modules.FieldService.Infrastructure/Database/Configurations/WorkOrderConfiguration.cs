using BubbaBag.Modules.FieldService.Domain.WorkOrders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database.Configurations;

public class WorkOrderConfiguration : IEntityTypeConfiguration<WorkOrder>
{
    public void Configure(EntityTypeBuilder<WorkOrder> builder)
    {
        builder.ToTable("WorkOrders", "fieldservice");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.CodigoWo)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(w => w.CodigoWo)
            .IsUnique();

        builder.Property(w => w.NumeroOrdenExterna)
            .HasMaxLength(100);

        builder.HasIndex(w => w.NumeroOrdenExterna);

        builder.Property(w => w.CodigoContratoIbs)
            .HasMaxLength(100);

        builder.HasIndex(w => w.CodigoContratoIbs);

        builder.Property(w => w.IdEncabezadoExterno)
            .HasMaxLength(100);

        // Estados
        builder.Property(w => w.EstadoSistema)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(w => w.EstadoSistema);

        builder.Property(w => w.EstadoInterno)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(w => w.EstadoInterno);

        builder.Property(w => w.EstadoExterno)
            .HasMaxLength(100);

        builder.Property(w => w.MotivoCierre)
            .HasMaxLength(100);

        builder.Property(w => w.BloqueHorario)
            .HasMaxLength(50);

        builder.Property(w => w.FirmaClienteUrl)
            .HasMaxLength(500);

        builder.Property(w => w.FotoFachadaUrl)
            .HasMaxLength(500);

        builder.Property(w => w.FotoInstalacionUrl)
            .HasMaxLength(500);

        builder.Property(w => w.ObservacionesGenerales)
            .HasMaxLength(1000);

        // Relaciones
        builder.HasOne(w => w.TipoOrden)
            .WithMany()
            .HasForeignKey(w => w.TipoOrdenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.OrigenOrden)
            .WithMany()
            .HasForeignKey(w => w.OrigenOrdenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.ClienteFacturacion)
            .WithMany()
            .HasForeignKey(w => w.ClienteFacturacionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.ClienteServicio)
            .WithMany()
            .HasForeignKey(w => w.ClienteServicioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(w => w.Tareas)
            .WithOne(t => t.WorkOrder)
            .HasForeignKey(t => t.WorkOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
