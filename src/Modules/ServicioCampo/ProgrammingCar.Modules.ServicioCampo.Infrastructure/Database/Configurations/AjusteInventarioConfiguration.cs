using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Configurations;

public class AjusteInventarioConfiguration : IEntityTypeConfiguration<AjusteInventario>
{
    public void Configure(EntityTypeBuilder<AjusteInventario> builder)
    {
        builder.ToTable("AjustesInventario", "inventario");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Numero).HasMaxLength(50).IsRequired();
        builder.Property(x => x.NumeroAprobacion).HasMaxLength(50);
        builder.Property(x => x.Tipo).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Motivo).HasMaxLength(250).IsRequired();
        builder.Property(x => x.DocumentoReferencia).HasMaxLength(100);
        builder.Property(x => x.Observaciones).HasMaxLength(1000);
        builder.Property(x => x.Estado).HasMaxLength(50).IsRequired();
        builder.Property(x => x.UsuarioRegistro).HasMaxLength(150).IsRequired();
        builder.Property(x => x.UsuarioAprobacion).HasMaxLength(150);
        builder.Property(x => x.TotalCantidad).HasPrecision(19, 5);
        builder.Property(x => x.ValorTotal).HasPrecision(18, 2);
        builder.Property(x => x.LineasJson).IsRequired();

        builder.HasIndex(x => x.Numero).IsUnique();
        builder.HasOne(x => x.Almacen).WithMany().HasForeignKey(x => x.AlmacenId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Ubicacion).WithMany().HasForeignKey(x => x.UbicacionId).OnDelete(DeleteBehavior.Restrict);
    }
}
