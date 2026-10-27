using ProgrammingCar.Modules.ServicioCampo.Domain.Plantillas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ConfiguracionServicioProductoConfiguration : IEntityTypeConfiguration<ConfiguracionServicioProducto>
{
    public void Configure(EntityTypeBuilder<ConfiguracionServicioProducto> builder)
    {
        builder.ToTable("PlantillasTrabajoServicios", "serviciocampo");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.ConfiguracionServicioId).IsRequired();
        builder.Property(p => p.ProductoId).IsRequired();

        builder.HasOne(p => p.ConfiguracionServicio)
            .WithMany(c => c.Servicios)
            .HasForeignKey(p => p.ConfiguracionServicioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Producto)
            .WithMany()
            .HasForeignKey(p => p.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.ConfiguracionServicioId);
        builder.HasIndex(p => p.ProductoId);
    }
}
