using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TareaTrabajoConfiguration : IEntityTypeConfiguration<TareaTrabajo>
{
    public void Configure(EntityTypeBuilder<TareaTrabajo> builder)
    {
        builder.ToTable("TareasTrabajo", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.NombreTarea)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.OrdenSecuencia)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(t => t.EsObligatoria)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(t => t.RequiereEvidencia)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(t => t.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(t => t.EvidenciaUrl)
            .HasMaxLength(500);

        builder.Property(t => t.ObservacionesTecnico)
            .HasMaxLength(500);

        builder.HasOne(t => t.Trabajo)
            .WithMany(tr => tr.Tareas)
            .HasForeignKey(t => t.TrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Tarea)
            .WithMany()
            .HasForeignKey(t => t.TareaId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
