using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class PlantillaSemanalConfiguration : IEntityTypeConfiguration<PlantillaSemanalFija>
{
    public void Configure(EntityTypeBuilder<PlantillaSemanalFija> builder)
    {
        builder.ToTable("PlantillasSemanales", "rrhh");
        builder.HasKey(p => p.Id);

        builder.HasOne(p => p.Empleado)
            .WithMany()
            .HasForeignKey(p => p.EmpleadoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Turno)
            .WithMany()
            .HasForeignKey(p => p.TurnoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(p => p.DiaSemana).IsRequired();
        builder.Property(p => p.EsDescanso).IsRequired();

        builder.HasIndex(p => new { p.EmpleadoId, p.DiaSemana }).IsUnique();
    }
}
