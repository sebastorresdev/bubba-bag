using BubbaBag.Modules.FieldService.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database.Configurations;

public class TipoTareaServicioConfiguration : IEntityTypeConfiguration<TipoTareaServicio>
{
    public void Configure(EntityTypeBuilder<TipoTareaServicio> builder)
    {
        builder.ToTable("TiposTareaServicio", "fieldservice");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.CodigoTarea)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(t => t.CodigoTarea)
            .IsUnique();

        builder.Property(t => t.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.Categoria)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.DuracionEstimadaMinutos)
            .IsRequired();

        builder.Property(t => t.EsTareaSiebel)
            .IsRequired();

        builder.Property(t => t.Activo)
            .IsRequired();
    }
}
