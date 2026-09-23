using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TrabajoConfiguration : IEntityTypeConfiguration<Trabajo>
{
    public void Configure(EntityTypeBuilder<Trabajo> builder)
    {
        builder.ToTable("Trabajos", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.CodigoTrabajo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(t => new { t.OrdenTrabajoId, t.CodigoTrabajo })
            .IsUnique();

        builder.Property(t => t.ItemNumero)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(t => t.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(t => t.TarifaBaseCongelada)
            .IsRequired()
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(t => t.Observaciones)
            .HasMaxLength(500);

        builder.HasOne(t => t.OrdenTrabajo)
            .WithMany(o => o.Trabajos)
            .HasForeignKey(t => t.OrdenTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Servicio)
            .WithMany()
            .HasForeignKey(t => t.ServicioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.PlantillaTrabajo)
            .WithMany()
            .HasForeignKey(t => t.PlantillaTrabajoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(t => t.Tareas)
            .WithOne(tt => tt.Trabajo)
            .HasForeignKey(tt => tt.TrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Materiales)
            .WithOne(m => m.Trabajo)
            .HasForeignKey(m => m.TrabajoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
