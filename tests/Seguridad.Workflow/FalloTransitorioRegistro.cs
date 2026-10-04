using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;

// Se ejecuta únicamente en la base aislada de esta suite. Falla después del INSERT
// para demostrar rollback, recarga del estado de Identity y reintento completo.
internal sealed class FalloTransitorioRegistro : DbCommandInterceptor
{
    private int pendiente;
    public int Fallos { get; private set; }
    public void Activar() => pendiente = 1;

    public override async ValueTask<DbDataReader> ReaderExecutedAsync(DbCommand command, CommandExecutedEventData eventData, DbDataReader result, CancellationToken cancellationToken = default)
    {
        if (command.CommandText.Contains("INSERT INTO seguridad.\"AspNetUsers\"", StringComparison.Ordinal)
            && command.Parameters.Cast<DbParameter>().Any(p => string.Equals(p.Value?.ToString(), "reintento@pruebas.invalid", StringComparison.OrdinalIgnoreCase))
            && Interlocked.Exchange(ref pendiente, 0) == 1)
        {
            Fallos++;
            await result.DisposeAsync();
            throw new NpgsqlException("Fallo transitorio de prueba después de insertar el usuario.", new TimeoutException());
        }
        return result;
    }
}
