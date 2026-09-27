using BubbaBag.Modules.ServicioCampo.Domain.Importaciones;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class DataImportJobErrorConfiguration : IEntityTypeConfiguration<DataImportJobError>
{
    public void Configure(EntityTypeBuilder<DataImportJobError> builder)
    {
        builder.ToTable("DataImportJobErrors", "serviciocampo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .ValueGeneratedNever();

        builder.Property(e => e.ClaveIdentificador)
            .HasMaxLength(150);

        builder.Property(e => e.Columna)
            .HasMaxLength(150);

        builder.Property(e => e.Mensaje)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(e => e.ValorOriginal)
            .HasMaxLength(1000);
    }
}
