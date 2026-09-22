using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class RecursoTecnicoConfiguration : IEntityTypeConfiguration<RecursoTecnico>
{
    public void Configure(EntityTypeBuilder<RecursoTecnico> builder)
    {
        builder.ToTable("RecursosTecnicos", "serviciocampo");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Codigo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(r => r.Codigo)
            .IsUnique();

        builder.Property(r => r.NombreCompleto)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.DocumentoIdentidad)
            .HasMaxLength(30);

        builder.Property(r => r.Telefono)
            .HasMaxLength(50);

        builder.Property(r => r.Email)
            .HasMaxLength(150);

        builder.Property(r => r.ZonaOperativaId)
            .IsRequired();

        builder.HasOne(r => r.ZonaOperativa)
            .WithMany()
            .HasForeignKey(r => r.ZonaOperativaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(r => r.AlmacenBaseId)
            .IsRequired();
        builder.HasIndex(r => r.AlmacenBaseId);

        builder.Property(r => r.AlmacenMovilId);
        builder.HasIndex(r => r.AlmacenMovilId);

        builder.Property(r => r.UsuarioId);
        builder.HasIndex(r => r.UsuarioId);

        builder.Property(r => r.EmpleadoId);
        builder.HasIndex(r => r.EmpleadoId);

        builder.Property(r => r.CapacidadMaximaOrdenesPorDia)
            .IsRequired()
            .HasDefaultValue(6);

        builder.Property(r => r.ColorHex)
            .HasMaxLength(10)
            .HasDefaultValue("#0078d4");

        builder.Property(r => r.Activo)
            .IsRequired()
            .HasDefaultValue(true);
    }
}
