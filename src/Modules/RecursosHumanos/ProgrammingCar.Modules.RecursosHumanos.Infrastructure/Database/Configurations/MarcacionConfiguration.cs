using ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.Marcaciones;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class MarcacionConfiguration : IEntityTypeConfiguration<MarcacionCruda>
{
    public void Configure(EntityTypeBuilder<MarcacionCruda> builder)
    {
        builder.ToTable("Marcaciones", "rrhh");
        builder.HasKey(m => m.Id);

        builder.HasOne(m => m.Empleado)
            .WithMany()
            .HasForeignKey(m => m.EmpleadoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(m => m.FechaHora).IsRequired();

        builder.Property(m => m.TipoMarca)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(m => m.Origen)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(m => m.MetodoAutenticacion)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(m => m.FotoUrl).HasColumnType("text");
        builder.Property(m => m.ObservacionDescarte).HasMaxLength(250);

        builder.Property(m => m.EsValida).IsRequired();
        builder.Property(m => m.Procesado).IsRequired();

        builder.HasIndex(m => new { m.EmpleadoId, m.FechaHora });
    }
}
