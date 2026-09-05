using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class EmpleadoConfiguration : IEntityTypeConfiguration<Empleado>
{
    public void Configure(EntityTypeBuilder<Empleado> builder)
    {
        builder.ToTable("Empleados", "rrhh");

        builder.HasKey(e => e.Id);

        // Datos Obligatorios
        builder.Property(e => e.Nombres).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Apellidos).IsRequired().HasMaxLength(100);
        builder.Property(e => e.TipoDocumento).IsRequired().HasMaxLength(20);
        builder.Property(e => e.NumeroDocumento).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Estado).IsRequired().HasMaxLength(50);

        // Datos de Contacto (Opcionales)
        builder.Property(e => e.Email).HasMaxLength(150);
        builder.Property(e => e.Telefono).HasMaxLength(20);
        builder.Property(e => e.Direccion).HasMaxLength(250);

        // Datos Laborales (Opcionales)
        builder.Property(e => e.Cargo).HasMaxLength(100);
        builder.Property(e => e.Departamento).HasMaxLength(100);
        builder.Property(e => e.TipoContrato).HasMaxLength(50);

        // Datos de Planilla
        builder.Property(e => e.SalarioBase).HasPrecision(18, 2);
        builder.Property(e => e.MonedaSalario).HasMaxLength(3);
        builder.Property(e => e.RegimenPensionario).HasMaxLength(50);
        builder.Property(e => e.Cuspp).HasMaxLength(20);

        // Datos Bancarios
        builder.Property(e => e.EntidadFinanciera).HasMaxLength(100);
        builder.Property(e => e.CuentaBancaria).HasMaxLength(50);
        builder.Property(e => e.CuentaInterbancaria).HasMaxLength(50);

        // Indices
        builder.HasIndex(e => new { e.TipoDocumento, e.NumeroDocumento }).IsUnique();
        builder.HasIndex(e => e.Email).IsUnique();
    }
}

