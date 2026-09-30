using BubbaBag.Modules.GestionDatos.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Database.Configurations;

public class DataImportJobConfiguration : IEntityTypeConfiguration<DataImportJob>
{
    public void Configure(EntityTypeBuilder<DataImportJob> builder)
    {
        builder.ToTable("DataImportJobs", "gestiondatos");

        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id)
            .ValueGeneratedNever();

        builder.Property(j => j.NombreArchivo)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(j => j.TipoRegistro)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(j => j.Estado)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(j => j.ModoDuplicados)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(j => j.CreadoPor)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(j => j.FechaCreacion)
            .IsRequired()
            .ValueGeneratedNever();

        builder.Property(j => j.FechaFinalizacion);

        builder.Property(j => j.TotalProcesados)
            .IsRequired();

        builder.Property(j => j.TotalExitosos)
            .IsRequired();

        builder.Property(j => j.TotalFallidos)
            .IsRequired();

        builder.Property(j => j.TotalParciales)
            .IsRequired();

        builder.Property(j => j.MapeoCamposJson)
            .HasColumnType("text");

        builder.Property(j => j.ParametrosDelimitadorJson)
            .HasColumnType("text");

        builder.HasMany(j => j.Errores)
            .WithOne(e => e.DataImportJob)
            .HasForeignKey(e => e.DataImportJobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

