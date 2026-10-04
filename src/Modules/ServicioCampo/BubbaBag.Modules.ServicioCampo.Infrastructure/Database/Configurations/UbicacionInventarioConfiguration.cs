using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Configurations;
public class UbicacionInventarioConfiguration : IEntityTypeConfiguration<UbicacionInventario>
{
    public void Configure(EntityTypeBuilder<UbicacionInventario> b)
    {
        b.ToTable("UbicacionesInventario", "inventario"); b.HasKey(x => x.Id);
        b.Property(x => x.Codigo).HasMaxLength(50); b.Property(x => x.Nombre).HasMaxLength(150);
        b.HasIndex(x => new { x.AlmacenId, x.Codigo }).IsUnique();
        b.HasIndex(x => x.AlmacenId).IsUnique().HasFilter("\"EsPrincipal\" = true");
        b.HasOne(x => x.Almacen).WithMany().HasForeignKey(x => x.AlmacenId).OnDelete(DeleteBehavior.Restrict);
    }
}
