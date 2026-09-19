using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ServicioConfiguration : IEntityTypeConfiguration<Servicio>
{
    public void Configure(EntityTypeBuilder<Servicio> builder)
    {
        builder.ToTable("Servicios", "serviciocampo");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.Codigo)
            .IsUnique();

        builder.Property(s => s.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(s => s.Descripcion)
            .HasMaxLength(400);

        builder.Property(s => s.CodigoExterno)
            .HasMaxLength(60);

        builder.HasMany(s => s.Pasos)
            .WithOne()
            .HasForeignKey(p => p.ServicioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.MaterialesTeoricos)
            .WithOne()
            .HasForeignKey(m => m.ServicioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.SucursalesHabilitadas)
            .WithOne()
            .HasForeignKey(ss => ss.ServicioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
