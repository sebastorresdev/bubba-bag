using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class DevolucionProveedorConfiguration : IEntityTypeConfiguration<DevolucionProveedor>
{
    public void Configure(EntityTypeBuilder<DevolucionProveedor> builder)
    {
        builder.ToTable("DevolucionesProveedor", "inventario");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Numero).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Proveedor).HasMaxLength(150).IsRequired();
        builder.Property(x => x.TipoDocumento).HasMaxLength(30).IsRequired();
        builder.Property(x => x.NumeroDocumento).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Motivo).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Observaciones).HasMaxLength(500);
        builder.Property(x => x.DocumentoRespaldoUrl).HasMaxLength(500);
        builder.Property(x => x.TotalCantidad).HasPrecision(18, 5);
        builder.Property(x => x.Estado).HasMaxLength(50).IsRequired();
        builder.Property(x => x.UsuarioNombre).HasMaxLength(150);
        builder.Property<uint>("xmin").IsRowVersion();

        builder.HasIndex(x => x.Numero).IsUnique();
        builder.HasIndex(x => x.AlmacenId);
        builder.HasIndex(x => x.Estado);
        builder.HasIndex(x => x.FechaRegistro);

        builder.HasOne(x => x.Almacen).WithMany().HasForeignKey(x => x.AlmacenId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Ubicacion).WithMany().HasForeignKey(x => x.UbicacionId).OnDelete(DeleteBehavior.Restrict);
    }
}
