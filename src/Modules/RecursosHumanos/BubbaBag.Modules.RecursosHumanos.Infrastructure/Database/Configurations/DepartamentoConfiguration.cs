using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Configurations;

public class DepartamentoConfiguration : IEntityTypeConfiguration<Departamento>
{
    public void Configure(EntityTypeBuilder<Departamento> builder)
    {
        builder.ToTable("Departamentos", "rrhh");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.Descripcion)
            .HasMaxLength(250);

        builder.Property(d => d.Activo)
            .IsRequired();

        builder.HasIndex(d => d.Nombre)
            .IsUnique();

        builder.HasMany(d => d.Cargos)
            .WithOne(c => c.Departamento)
            .HasForeignKey(c => c.DepartamentoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
