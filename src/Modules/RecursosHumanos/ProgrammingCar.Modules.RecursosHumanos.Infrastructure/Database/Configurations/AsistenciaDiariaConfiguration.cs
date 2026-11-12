using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Consolidado;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class AsistenciaDiariaConfiguration : IEntityTypeConfiguration<AsistenciaDiaria>
{
    public void Configure(EntityTypeBuilder<AsistenciaDiaria> builder)
    {
        builder.ToTable("AsistenciasDiarias", "rrhh");
        builder.HasKey(a => a.Id);

        builder.HasOne(a => a.Empleado)
            .WithMany()
            .HasForeignKey(a => a.EmpleadoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Turno)
            .WithMany()
            .HasForeignKey(a => a.TurnoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(a => a.FechaOperativa).IsRequired();

        builder.Property(a => a.HorasTrabajadas).HasPrecision(18, 2);
        builder.Property(a => a.HorasDiurnas).HasPrecision(18, 2);
        builder.Property(a => a.HorasNocturnas).HasPrecision(18, 2);

        builder.Property(a => a.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.Observacion).HasMaxLength(500);

        builder.HasIndex(a => new { a.EmpleadoId, a.FechaOperativa }).IsUnique();
    }
}
