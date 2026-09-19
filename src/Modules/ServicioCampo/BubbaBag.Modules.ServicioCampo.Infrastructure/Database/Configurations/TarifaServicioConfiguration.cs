using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TarifaServicioConfiguration : IEntityTypeConfiguration<TarifaServicio>
{
    public void Configure(EntityTypeBuilder<TarifaServicio> builder)
    {
        builder.ToTable("TarifasServicio", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Tipificacion)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.EmpresaContratante)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.CodigoServicio)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(t => t.DetalleServicio)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasOne(t => t.TipoTareaServicio)
            .WithMany()
            .HasForeignKey(t => t.TipoTareaServicioId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(t => t.Sucursal)
            .HasMaxLength(80);

        builder.Property(t => t.FijoBase)
            .HasPrecision(18, 2);

        builder.Property(t => t.FijoAdicional)
            .HasPrecision(18, 2);

        builder.Property(t => t.VariableTotal)
            .HasPrecision(18, 2);

        builder.Property(t => t.Indicador1_CycleTime)
            .HasPrecision(18, 2);

        builder.Property(t => t.Indicador2_Agenda)
            .HasPrecision(18, 2);

        builder.Property(t => t.Indicador3_Sin30)
            .HasPrecision(18, 2);

        builder.Property(t => t.VariableAdicionalTotal)
            .HasPrecision(18, 2);

        builder.Property(t => t.Indicador1_Adicional)
            .HasPrecision(18, 2);

        builder.Property(t => t.Indicador2_Adicional)
            .HasPrecision(18, 2);

        builder.Property(t => t.Indicador3_Adicional)
            .HasPrecision(18, 2);

        builder.Property(t => t.MontoTotalTeorico)
            .HasPrecision(18, 2);

        builder.HasOne(t => t.ClienteFacturacion)
            .WithMany()
            .HasForeignKey(t => t.ClienteFacturacionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => new { t.EmpresaContratante, t.CodigoServicio, t.Sucursal });
    }
}
