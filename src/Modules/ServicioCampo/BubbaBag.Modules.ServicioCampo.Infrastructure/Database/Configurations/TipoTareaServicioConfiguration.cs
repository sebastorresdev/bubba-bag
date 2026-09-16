using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TipoTareaServicioConfiguration : IEntityTypeConfiguration<TipoTareaServicio>
{
    public void Configure(EntityTypeBuilder<TipoTareaServicio> builder)
    {
        builder.ToTable("TiposTareaServicio", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.CodigoTarea)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(t => t.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.ClienteFacturacionId)
            .IsRequired();

        builder.HasOne(t => t.ClienteFacturacion)
            .WithMany()
            .HasForeignKey(t => t.ClienteFacturacionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => new { t.ClienteFacturacionId, t.CodigoTarea })
            .IsUnique();

        builder.Property(t => t.DuracionEstimadaMinutos)
            .IsRequired();

        builder.Property(t => t.Activo)
            .IsRequired();
    }
}
