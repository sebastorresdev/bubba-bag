using BubbaBag.Modules.FieldService.Domain.WorkOrders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database.Configurations;

public class WorkOrderTareaConfiguration : IEntityTypeConfiguration<WorkOrderTarea>
{
    public void Configure(EntityTypeBuilder<WorkOrderTarea> builder)
    {
        builder.ToTable("WorkOrderTareas", "fieldservice");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.NumeroWoIbs)
            .HasMaxLength(50);

        builder.Property(t => t.ItemNumero)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(t => t.EstadoTarea)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(t => t.TarifaBaseCongelada)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(t => t.EsElegibleBonoIndicador)
            .IsRequired();

        builder.Property(t => t.NombreReglaAplicada)
            .HasMaxLength(150);

        builder.Property(t => t.MontoBonoFinal)
            .HasPrecision(10, 2)
            .HasDefaultValue(0.00m);

        builder.Property(t => t.MontoPenalizacion)
            .HasPrecision(10, 2)
            .HasDefaultValue(0.00m);

        builder.Property(t => t.Descripcion)
            .HasMaxLength(500);

        builder.Property(t => t.ObservacionesCierre)
            .HasMaxLength(500);

        builder.Property(t => t.MotivoNoRealizada)
            .HasMaxLength(150);

        // Relaciones
        builder.HasOne(t => t.TipoTarea)
            .WithMany()
            .HasForeignKey(t => t.TipoTareaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.TarifarioRegla)
            .WithMany()
            .HasForeignKey(t => t.TarifarioReglaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => t.WorkOrderId);
        builder.HasIndex(t => t.NumeroWoIbs);
    }
}
