using Microsoft.EntityFrameworkCore;
namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database;

public static class MigracionUbicacionesInventario
{
    public static async Task AplicarAsync(ServicioCampoDbContext db,CancellationToken ct=default)
    {
        var asm=typeof(MigracionUbicacionesInventario).Assembly;
        var nombre=asm.GetManifestResourceNames().Single(x=>x.EndsWith("inventario-ubicaciones.sql"));
        using var stream=asm.GetManifestResourceStream(nombre)!;
        using var reader=new StreamReader(stream);
        var sql=await reader.ReadToEndAsync(ct);
        await db.EjecutarEnTransaccionAsync(token=>db.Database.ExecuteSqlRawAsync(sql,token),ct);
    }
}
