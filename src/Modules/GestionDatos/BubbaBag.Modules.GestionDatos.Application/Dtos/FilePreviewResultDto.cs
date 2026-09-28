using System.Collections.Generic;

namespace BubbaBag.Modules.GestionDatos.Application.Dtos;

public class FilePreviewResultDto
{
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string DetectedDelimiter { get; set; } = ",";
    public string DetectedQuoteChar { get; set; } = "\"";
    public bool HasHeader { get; set; } = true;
    public List<string> Headers { get; set; } = new();
    public List<List<string>> SampleRows { get; set; } = new();
    public int TotalEstimatedRows { get; set; }
}

public class PreviewFileRequest
{
    public string? Delimiter { get; set; }
    public string? QuoteChar { get; set; }
    public bool HasHeader { get; set; } = true;
}

