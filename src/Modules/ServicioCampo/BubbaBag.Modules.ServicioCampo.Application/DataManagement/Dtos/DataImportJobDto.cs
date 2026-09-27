using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.DataManagement.Dtos;

public class DataImportJobDto
{
    public Guid Id { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string TipoRegistro { get; set; } = string.Empty;
    public long TamanoBytes { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string ModoDuplicados { get; set; } = "Upsert";
    public bool PermitirDuplicados { get; set; }
    public string CreadoPor { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaFinalizacion { get; set; }
    public int TotalProcesados { get; set; }
    public int TotalExitosos { get; set; }
    public int TotalFallidos { get; set; }
    public int TotalParciales { get; set; }
    public Dictionary<string, string>? MapeoCampos { get; set; }
    public List<DataImportJobErrorDto> Errores { get; set; } = new();
}

public class DataImportJobErrorDto
{
    public Guid Id { get; set; }
    public int Fila { get; set; }
    public string? ClaveIdentificador { get; set; }
    public string? Columna { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string? ValorOriginal { get; set; }
}

public class ExecuteImportRequestDto
{
    public string EntityName { get; set; } = "Producto";
    public string DuplicateMode { get; set; } = "Upsert"; // "Upsert", "Skip", "Error"
    public string? Delimiter { get; set; }
    public string? QuoteChar { get; set; }
    public Dictionary<string, string> ColumnMapping { get; set; } = new();
}
