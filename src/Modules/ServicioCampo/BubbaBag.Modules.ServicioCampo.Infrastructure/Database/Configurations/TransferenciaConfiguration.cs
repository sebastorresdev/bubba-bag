using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class TransferenciaConfiguration : IEntityTypeConfiguration<Transferencia>
{
    public void Configure(EntityTypeBuilder<Transferencia> builder)
    {
        builder.ToTable("Transferencias", "inventario");

        builder.HasKey(t => t.Id);
        builder.Property<uint>("xmin").IsRowVersion();
        builder.HasIndex(t => t.OperacionId).IsUnique();
        builder.HasOne<UbicacionInventario>().WithMany().HasForeignKey(t => t.UbicacionOrigenId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<UbicacionInventario>().WithMany().HasForeignKey(t => t.UbicacionDestinoId).OnDelete(DeleteBehavior.Restrict);

        builder.Property(t => t.Numero)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.AlmacenOrigenId)
            .IsRequired();

        builder.Property(t => t.AlmacenDestinoId)
            .IsRequired();

        builder.Property(t => t.UnidadOrganizativaOrigenId)
            .IsRequired();

        builder.Property(t => t.UnidadOrganizativaDestinoId)
            .IsRequired();

        builder.Property(t => t.Modalidad)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(t => t.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(t => t.FechaRegistro)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(t => t.DespachadoPorNombre)
            .HasMaxLength(150);

        builder.Property(t => t.NumeroGuiaRemision)
            .HasMaxLength(100);

        builder.Property(t => t.Observaciones)
            .HasMaxLength(500);

        builder.HasOne(t => t.AlmacenOrigen)
            .WithMany()
            .HasForeignKey(t => t.AlmacenOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.AlmacenDestino)
            .WithMany()
            .HasForeignKey(t => t.AlmacenDestinoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Lineas)
            .WithOne()
            .HasForeignKey(l => l.TransferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Recepciones)
            .WithOne(r => r.Transferencia)
            .HasForeignKey(r => r.TransferenciaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.Numero).IsUnique();
        builder.HasIndex(t => t.AlmacenOrigenId);
        builder.HasIndex(t => t.AlmacenDestinoId);
        builder.HasIndex(t => t.Estado);
        builder.HasIndex(t => t.FechaRegistro);
    }
}
