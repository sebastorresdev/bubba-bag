using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class SucursalServicioConfiguration : IEntityTypeConfiguration<SucursalServicio>
{
    public void Configure(EntityTypeBuilder<SucursalServicio> builder)
    {
        builder.ToTable("SucursalesServicio", "serviciocampo");

        builder.HasKey(s => s.Id);

        builder.HasIndex(s => new { s.SucursalId, s.ServicioId })
            .IsUnique();

        builder.Property(s => s.Habilitado)
            .IsRequired();
    }
}
