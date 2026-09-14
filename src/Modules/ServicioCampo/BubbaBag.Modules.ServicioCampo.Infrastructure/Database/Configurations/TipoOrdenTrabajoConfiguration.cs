using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TipoOrdenTrabajoConfiguration : IEntityTypeConfiguration<TipoOrdenTrabajo>
{
    public void Configure(EntityTypeBuilder<TipoOrdenTrabajo> builder)
    {
        builder.ToTable("TiposOrdenTrabajo", "serviciocampo");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Codigo)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(t => t.Codigo)
            .IsUnique();

        builder.Property(t => t.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.Descripcion)
            .HasMaxLength(250);

        builder.Property(t => t.ColorHex)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("#0f6cbd");

        builder.Property(t => t.RequiereVisitaCampo)
            .IsRequired();

        builder.Property(t => t.ExigeFirmaCliente)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(t => t.ExigeEvidenciasFotograficas)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(t => t.Activo)
            .IsRequired();
    }
}
