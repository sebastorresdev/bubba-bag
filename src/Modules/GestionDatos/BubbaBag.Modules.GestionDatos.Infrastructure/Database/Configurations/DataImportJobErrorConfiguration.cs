using BubbaBag.Modules.GestionDatos.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Database.Configurations;

public class DataImportJobErrorConfiguration : IEntityTypeConfiguration<DataImportJobError>
{
    public void Configure(EntityTypeBuilder<DataImportJobError> builder)
    {
        builder.ToTable("DataImportJobErrors", "GestionDatos");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .ValueGeneratedNever();

        builder.Property(e => e.Fila)
            .IsRequired();

        builder.Property(e => e.ClaveIdentificador)
            .HasMaxLength(150);

        builder.Property(e => e.Columna)
            .HasMaxLength(150);

        builder.Property(e => e.Mensaje)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(e => e.ValorOriginal)
            .HasMaxLength(1000);

        builder.HasOne(e => e.DataImportJob)
            .WithMany(j => j.Errores)
            .HasForeignKey(e => e.DataImportJobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

