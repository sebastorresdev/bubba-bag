using System;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace BubbaBag.Api.Services;

public class PostgresCodigoSecuencialService : ICodigoSecuencialService
{
    private readonly NpgsqlDataSource? _dataSource;
    private readonly string? _connectionString;

    public PostgresCodigoSecuencialService(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        _dataSource = serviceProvider.GetService<NpgsqlDataSource>();
        _connectionString = configuration.GetConnectionString("sqldb");
    }

    public async Task<string> SiguienteCodigoAsync(
        string prefijo,
        string nombreSecuencia,
        string esquema,
        int longitud = 6,
        CancellationToken cancellationToken = default)
    {
        if (!Regex.IsMatch(esquema, @"^[a-zA-Z0-9_]+$"))
            throw new ArgumentException("Nombre de esquema inválido.", nameof(esquema));
        if (!Regex.IsMatch(nombreSecuencia, @"^[a-zA-Z0-9_]+$"))
            throw new ArgumentException("Nombre de secuencia inválido.", nameof(nombreSecuencia));

        await using var connection = _dataSource != null 
            ? await _dataSource.OpenConnectionAsync(cancellationToken) 
            : new NpgsqlConnection(_connectionString);

        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        // Asegurar que la secuencia exista en PostgreSQL
        var ensureSql = $"CREATE SEQUENCE IF NOT EXISTS \"{esquema}\".\"{nombreSecuencia}\" START WITH 1 INCREMENT BY 1;";
        await using (var cmdEnsure = new NpgsqlCommand(ensureSql, connection))
        {
            await cmdEnsure.ExecuteNonQueryAsync(cancellationToken);
        }

        // Obtener el siguiente valor atómico
        var nextValSql = $"SELECT nextval('\"{esquema}\".\"{nombreSecuencia}\"');";
        await using (var cmdNext = new NpgsqlCommand(nextValSql, connection))
        {
            var result = await cmdNext.ExecuteScalarAsync(cancellationToken);
            long valor = Convert.ToInt64(result);
            return $"{prefijo}-{valor.ToString().PadLeft(longitud, '0')}";
        }
    }
}
