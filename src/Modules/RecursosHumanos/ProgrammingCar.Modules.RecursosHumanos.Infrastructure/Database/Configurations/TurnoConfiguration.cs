using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class TurnoConfiguration : IEntityTypeConfiguration<Turno>
{
    public void Configure(EntityTypeBuilder<Turno> builder)
    {
        builder.ToTable("Turnos", "rrhh");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Codigo).IsRequired().HasMaxLength(30);
        builder.HasIndex(t => t.Codigo).IsUnique();

        builder.Property(t => t.Nombre).IsRequired().HasMaxLength(100);

        builder.Property(t => t.HoraInicio).IsRequired();
        builder.Property(t => t.HoraFin).IsRequired();
        builder.Property(t => t.CruzaMedianoche).IsRequired();

        builder.Property(t => t.MinutosRefrigerio).IsRequired();
        builder.Property(t => t.MinutosToleranciaEntrada).IsRequired();
        builder.Property(t => t.MinutosToleranciaRefrigerio).IsRequired();

        builder.Property(t => t.VentanaEntradaInicio).IsRequired();
        builder.Property(t => t.VentanaEntradaFin).IsRequired();
        builder.Property(t => t.VentanaSalidaInicio).IsRequired();
        builder.Property(t => t.VentanaSalidaFin).IsRequired();

        builder.Property(t => t.Activo).IsRequired();
    }
}
