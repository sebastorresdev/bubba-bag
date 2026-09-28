using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.GestionDatos.Application.Dtos;

namespace BubbaBag.Modules.GestionDatos.Application.Services;

public record EntityImportRowError(
    int Fila,
    string Mensaje,
    string? ClaveIdentificador = null,
    string? Columna = null,
    string? ValorOriginal = null);

public record EntityImportExecutionResult(
    int TotalProcesados,
    int TotalExitosos,
    int TotalFallidos,
    int TotalParciales,
    List<EntityImportRowError> Errores);

/// <summary>
/// Contrato que implementa cada módulo de negocio (ServicioCampo, RecursosHumanos, etc.)
/// para registrar entidades importables y procesar sus filas mapeadas.
/// </summary>
public interface IEntityImportProvider
{
    // Catálogo de entidades que este proveedor ofrece para importar
    IEnumerable<EntityImportDescriptorDto> GetDescriptors();

    // Determina si este proveedor puede procesar la entidad indicada
    bool Supports(string entityName);

    // Ejecuta la inserción o actualización de las entidades en la base de datos
    Task<EntityImportExecutionResult> ImportAsync(
        string entityName,
        IReadOnlyList<Dictionary<string, string>> mappedRows,
        string duplicateMode,
        CancellationToken cancellationToken = default);
}

