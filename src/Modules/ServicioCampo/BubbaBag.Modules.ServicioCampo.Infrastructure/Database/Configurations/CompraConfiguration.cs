using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class CompraConfiguration : IEntityTypeConfiguration<Compra>
{
    public void Configure(EntityTypeBuilder<Compra> builder)
    {
        builder.ToTable("Compras", "inventario");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Numero).HasMaxLength(40);
        builder.Property(x => x.Proveedor).HasMaxLength(150);
        builder.Property(x => x.TipoDocumento).HasMaxLength(30);
        builder.Property(x => x.NumeroDocumento).HasMaxLength(100);
        builder.Property(x => x.Moneda).HasMaxLength(3);
        builder.Property(x => x.Observacion).HasMaxLength(500);
        builder.Property(x => x.Total).HasPrecision(18, 2);
        builder.Property(x => x.Estado).HasMaxLength(50);
        builder.Property(x => x.UsuarioRecepcionId);
        builder.Property(x => x.FechaRecepcion);
        builder.Property<uint>("xmin").IsRowVersion();
        builder.HasIndex(x => new { x.Proveedor, x.TipoDocumento, x.NumeroDocumento }).IsUnique().HasFilter("\"NumeroDocumento\" <> ''");
        builder.HasOne(x => x.Almacen).WithMany().HasForeignKey(x => x.AlmacenId).OnDelete(DeleteBehavior.Restrict);
    }
}
