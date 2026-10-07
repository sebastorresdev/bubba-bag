using BubbaBag.Modules.ServicioCampo.Domain.Configuracion;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ConfiguracionEmpresaConfiguration : IEntityTypeConfiguration<ConfiguracionEmpresa>
{
    public void Configure(EntityTypeBuilder<ConfiguracionEmpresa> builder)
    {
        builder.ToTable("ConfiguracionEmpresa", "public");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.RazonSocial).HasMaxLength(250).IsRequired();
        builder.Property(x => x.NombreComercial).HasMaxLength(250);
        builder.Property(x => x.Ruc).HasMaxLength(50);
        builder.Property(x => x.DireccionFiscal).HasMaxLength(300);
        builder.Property(x => x.Telefono).HasMaxLength(50);
        builder.Property(x => x.Email).HasMaxLength(150);
        builder.Property(x => x.LogoBase64).HasColumnType("text");
        builder.Property(x => x.PiePaginaDocumentos).HasMaxLength(500);
    }
}
