using ProgrammingCar.Modules.ServicioCampo.Domain.Clientes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class ContactoConfiguration : IEntityTypeConfiguration<Contacto>
{
    public void Configure(EntityTypeBuilder<Contacto> builder)
    {
        builder.ToTable("contactos", "crm");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombres)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(c => c.Apellidos)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(c => c.Cargo)
            .HasMaxLength(120);

        builder.Property(c => c.Email)
            .HasMaxLength(150);

        builder.Property(c => c.TelefonoMovil)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(c => c.TelefonoTrabajo)
            .HasMaxLength(30);

        builder.Property(c => c.Direccion)
            .HasMaxLength(250);

        builder.Property(c => c.UbigeoCodigo)
            .HasMaxLength(10);

        builder.HasOne(c => c.Ubigeo)
            .WithMany()
            .HasForeignKey(c => c.UbigeoCodigo)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Cuenta)
            .WithMany(a => a.Contactos)
            .HasForeignKey(c => c.CuentaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(c => c.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(c => c.CreatedAt)
            .IsRequired();
    }
}
