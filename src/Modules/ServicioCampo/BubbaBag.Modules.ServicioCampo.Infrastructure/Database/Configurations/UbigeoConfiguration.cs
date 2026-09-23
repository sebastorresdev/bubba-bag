using BubbaBag.Modules.ServicioCampo.Domain.Ubigeos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class UbigeoConfiguration : IEntityTypeConfiguration<Ubigeo>
{
    public void Configure(EntityTypeBuilder<Ubigeo> builder)
    {
        builder.ToTable("ubigeos", "crm");

        builder.HasKey(u => u.Codigo);

        builder.Property(u => u.Codigo)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(u => u.Departamento)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Provincia)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Distrito)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.CapitalLegal)
            .HasMaxLength(150);

        builder.Property(u => u.CodigoRegionNatural)
            .HasMaxLength(10);

        builder.Property(u => u.RegionNatural)
            .HasMaxLength(50);

        builder.HasIndex(u => u.Departamento);
        builder.HasIndex(u => new { u.Departamento, u.Provincia });
    }
}
