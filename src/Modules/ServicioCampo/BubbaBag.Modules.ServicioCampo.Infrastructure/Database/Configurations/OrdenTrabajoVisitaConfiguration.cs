using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class OrdenTrabajoVisitaConfiguration : IEntityTypeConfiguration<OrdenTrabajoVisita>
{
    public void Configure(EntityTypeBuilder<OrdenTrabajoVisita> builder)
    {
        builder.ToTable("OrdenTrabajoVisitas", "serviciocampo");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.CodigoVisita)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(v => v.CodigoVisita)
            .IsUnique();

        builder.Property(v => v.NumeroVisita)
            .IsRequired();

        builder.HasIndex(v => new { v.OrdenTrabajoId, v.NumeroVisita })
            .IsUnique();

        builder.Property(v => v.NumeroVisitaSiebel)
            .HasMaxLength(50);

        builder.HasIndex(v => v.NumeroVisitaSiebel);

        builder.Property(v => v.NumeroVisitaToa)
            .HasMaxLength(50);

        builder.HasIndex(v => v.NumeroVisitaToa);

        builder.Property(v => v.CuadrillaTecnicoId)
            .IsRequired();

        builder.HasIndex(v => v.CuadrillaTecnicoId);

        builder.Property(v => v.FechaProgramada)
            .IsRequired();

        builder.HasIndex(v => v.FechaProgramada);

        builder.Property(v => v.BloqueHorario)
            .HasMaxLength(50);

        builder.Property(v => v.Estado)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(v => v.Estado);

        // Firma Digital
        builder.Property(v => v.FirmaClienteUrl)
            .HasMaxLength(500);

        builder.Property(v => v.FirmadoPor)
            .HasMaxLength(50);

        builder.Property(v => v.NombreFirmante)
            .HasMaxLength(150);

        builder.Property(v => v.DniFirmante)
            .HasMaxLength(30);

        builder.Property(v => v.EvidenciasConfirmadas)
            .IsRequired();

        // Auditoría de Cancelación
        builder.Property(v => v.ObservacionesCancelacion)
            .HasMaxLength(500);

        builder.Property(v => v.ObservacionesTecnico)
            .HasMaxLength(1000);

        // Relaciones
        builder.HasOne(v => v.MotivoCancelacion)
            .WithMany()
            .HasForeignKey(v => v.MotivoCancelacionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(v => v.Evidencias)
            .WithOne(e => e.OrdenTrabajoVisita)
            .HasForeignKey(e => e.OrdenTrabajoVisitaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
