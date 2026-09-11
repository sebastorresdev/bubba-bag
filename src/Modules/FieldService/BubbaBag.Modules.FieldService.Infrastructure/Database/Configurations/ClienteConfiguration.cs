using BubbaBag.Modules.FieldService.Domain.Clientes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.FieldService.Infrastructure.Database.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Clientes", "fieldservice");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CodigoCliente)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(c => c.CodigoCliente)
            .IsUnique();

        builder.Property(c => c.TipoPersona)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.TipoDocumento)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(c => c.DocumentoIdentidad)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(c => c.DocumentoIdentidad);

        builder.Property(c => c.Nombres)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Apellidos)
            .HasMaxLength(100);

        builder.Property(c => c.RazonSocial)
            .HasMaxLength(200);

        builder.Property(c => c.TelefonoPrincipal)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.TelefonoSecundario)
            .HasMaxLength(20);

        builder.Property(c => c.Email)
            .HasMaxLength(150);

        builder.Property(c => c.Direccion)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(c => c.Distrito)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Provincia)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Departamento)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.ReferenciaUbicacion)
            .HasMaxLength(250);

        builder.Property(c => c.CoordenadaLat)
            .HasPrecision(10, 7);

        builder.Property(c => c.CoordenadaLng)
            .HasPrecision(10, 7);

        builder.Property(c => c.EsClienteFacturacion)
            .IsRequired();

        builder.Property(c => c.EsClienteServicio)
            .IsRequired();

        builder.Property(c => c.Activo)
            .IsRequired();
    }
}
