using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class OrdenTrabajoConfiguration : IEntityTypeConfiguration<OrdenTrabajo>
{
    public void Configure(EntityTypeBuilder<OrdenTrabajo> builder)
    {
        builder.ToTable("OrdenesTrabajo", "serviciocampo");

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
        builder.Property(w => w.Estado)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(w => w.Estado);

        builder.Property(w => w.EstadoSistema)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(w => w.EstadoSistema);

        builder.Property(w => w.EstadoExterno)
            .HasMaxLength(100);

        builder.Property(w => w.ObservacionesCierre)
            .HasMaxLength(500);

        // Gestión y descarga de materiales consolidada en la Orden
        builder.Property(w => w.NoConsumioMateriales)
            .IsRequired();

        builder.Property(w => w.DescargaMaterialesOmitida)
            .IsRequired();

        builder.Property(w => w.MotivoOmisionMateriales)
            .HasMaxLength(250);

        builder.Property(w => w.DescargaMaterialesObligatoria)
            .IsRequired();

        builder.Property(w => w.DescargaMaterialesConfirmada)
            .IsRequired();

        builder.Property(w => w.FechaDescargaMateriales);

        builder.Property(w => w.ContadorOmisionDescarga)
            .IsRequired();

        // Ignorar propiedades calculadas de conveniencia delegadas a VisitaActual
        builder.Ignore(w => w.VisitaActual);
        builder.Ignore(w => w.CuadrillaTecnicoId);
        builder.Ignore(w => w.FechaProgramada);
        builder.Ignore(w => w.BloqueHorario);
        builder.Ignore(w => w.FechaInicioReal);
        builder.Ignore(w => w.FechaCierreReal);
        builder.Ignore(w => w.FirmaClienteUrl);
        builder.Ignore(w => w.EvidenciasConfirmadas);
        builder.Ignore(w => w.ObservacionesGenerales);

        // Relaciones maestras
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

        builder.HasOne(w => w.MotivoCierre)
            .WithMany()
            .HasForeignKey(w => w.MotivoCierreId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones hijas (Visitas y Tareas)
        builder.HasMany(w => w.Visitas)
            .WithOne(v => v.OrdenTrabajo)
            .HasForeignKey(v => v.OrdenTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Tareas)
            .WithOne(t => t.OrdenTrabajo)
            .HasForeignKey(t => t.OrdenTrabajoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
