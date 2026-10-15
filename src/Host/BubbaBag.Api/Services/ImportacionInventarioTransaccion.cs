using BubbaBag.Modules.GestionDatos.Application.Dtos;
using BubbaBag.Modules.GestionDatos.Application.Services;
using BubbaBag.Modules.GestionDatos.Infrastructure.Database;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace BubbaBag.Api.Services;

public sealed class ImportacionInventarioTransaccion(GestionDatosDbContext historial, ServicioCampoDbContext inventario) : IImportacionInventarioTransaccion
{
    // La apertura es infrecuente: serializar sus lotes evita duplicar ubicaciones o perder incrementos entre cargas.
    public async Task<DataImportJobDto> EjecutarAsync(Func<CancellationToken, Task<DataImportJobDto>> operacion, CancellationToken ct)
    {
        if (!historial.Database.IsRelational()) return await operacion(ct);
        return await historial.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            historial.ChangeTracker.Clear(); inventario.ChangeTracker.Clear();
            var conexion = historial.Database.GetDbConnection();
            inventario.Database.SetDbConnection(conexion, contextOwnsConnection: false);
            await using var transaccion = await historial.Database.BeginTransactionAsync(ct);
            await inventario.Database.UseTransactionAsync(transaccion.GetDbTransaction(), ct);
            try
            {
                await historial.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(761004304, 1)", ct);
                var result = await operacion(ct);
                await transaccion.CommitAsync(ct);
                return result;
            }
            catch
            {
                await transaccion.RollbackAsync(CancellationToken.None);
                historial.ChangeTracker.Clear(); inventario.ChangeTracker.Clear();
                throw;
            }
            finally { await inventario.Database.UseTransactionAsync(null, CancellationToken.None); }
        });
    }
}
