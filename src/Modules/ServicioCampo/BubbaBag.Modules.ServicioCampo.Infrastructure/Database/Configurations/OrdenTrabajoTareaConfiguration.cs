using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class OrdenTrabajoTareaConfiguration : IEntityTypeConfiguration<OrdenTrabajoTarea>
{
    public void Configure(EntityTypeBuilder<OrdenTrabajoTarea> builder)
    {
        builder.ToTable("OrdenTrabajoTareas", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.CodigoTarea)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(t => t.CodigoTarea)
            .IsUnique();

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

        builder.Property(t => t.ObservacionesRechazo)
            .HasMaxLength(300);

        // Relaciones
        builder.HasOne(t => t.TipoTarea)
            .WithMany()
            .HasForeignKey(t => t.TipoTareaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.TarifarioRegla)
            .WithMany()
            .HasForeignKey(t => t.TarifarioReglaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.MotivoRechazo)
            .WithMany()
            .HasForeignKey(t => t.MotivoRechazoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.OrdenTrabajoId);
        builder.HasIndex(t => t.NumeroWoIbs);
    }
}
