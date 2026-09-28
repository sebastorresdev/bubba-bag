using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.GestionDatos.Application;
using BubbaBag.Modules.GestionDatos.Application.Dtos;
using BubbaBag.Modules.GestionDatos.Application.Services;
using BubbaBag.Modules.GestionDatos.Domain;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Services;

public class DataImportEngineService : IDataImportEngineService
{
    private readonly IGestionDatosDbContext _context;
    private readonly IEnumerable<IEntityImportProvider> _providers;
    private readonly IEntityImportMetadataService _metadataService;

    public DataImportEngineService(
        IGestionDatosDbContext context,
        IEnumerable<IEntityImportProvider> providers,
        IEntityImportMetadataService metadataService)
    {
        _context = context;
        _providers = providers;
        _metadataService = metadataService;
    }

    #region PREVIEW

    public async Task<FilePreviewResultDto> PreviewFileAsync(
        Stream stream,
        string fileName,
        PreviewFileRequest request,
        CancellationToken cancellationToken = default)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var result = new FilePreviewResultDto
        {
            FileName = fileName,
            FileSizeBytes = stream.CanSeek ? stream.Length : 0,
            HasHeader = request.HasHeader
        };

        if (ext == ".csv" || ext == ".txt")
        {
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 4096, leaveOpen: true);
            var lines = new List<string>();
            string? line;
            while ((line = await reader.ReadLineAsync(cancellationToken)) != null && lines.Count < 50)
            {
                if (!string.IsNullOrWhiteSpace(line))
                    lines.Add(line);
            }

            if (lines.Count == 0)
                return result;

            char delimiter = string.IsNullOrEmpty(request.Delimiter)
                ? DetectDelimiter(lines.Take(5).ToList())
                : request.Delimiter[0];

            result.DetectedDelimiter = delimiter.ToString();
            result.DetectedQuoteChar = "\"";

            var parsedRows = lines.Select(l => ParseDelimitedLine(l, delimiter)).ToList();

            if (request.HasHeader && parsedRows.Count > 0)
            {
                result.Headers = parsedRows[0];
                result.SampleRows = parsedRows.Skip(1).Take(10).ToList();
            }
            else
            {
                int maxCols = parsedRows.Max(r => r.Count);
                result.Headers = Enumerable.Range(1, maxCols).Select(i => $"Columna {i}").ToList();
                result.SampleRows = parsedRows.Take(10).ToList();
            }

            result.TotalEstimatedRows = lines.Count;
        }
        else if (ext == ".xlsx")
        {
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.FirstOrDefault();
            if (worksheet == null || worksheet.IsEmpty())
                return result;

            result.DetectedDelimiter = ",";
            result.DetectedQuoteChar = "\"";

            int firstRowUsed = worksheet.FirstRowUsed()?.RowNumber() ?? 1;
            int lastRowUsed = worksheet.LastRowUsed()?.RowNumber() ?? 1;
            int lastColUsed = worksheet.LastColumnUsed()?.ColumnNumber() ?? 1;

            if (request.HasHeader)
            {
                var headerRow = worksheet.Row(firstRowUsed);
                for (int col = 1; col <= lastColUsed; col++)
                {
                    result.Headers.Add(headerRow.Cell(col).GetString().Trim());
                }

                int sampleCount = 0;
                for (int row = firstRowUsed + 1; row <= lastRowUsed && sampleCount < 10; row++)
                {
                    var r = worksheet.Row(row);
                    var rowData = new List<string>();
                    for (int col = 1; col <= lastColUsed; col++)
                    {
                        rowData.Add(r.Cell(col).GetString().Trim());
                    }
                    if (rowData.Any(c => !string.IsNullOrEmpty(c)))
                    {
                        result.SampleRows.Add(rowData);
                        sampleCount++;
                    }
                }
            }
            else
            {
                result.Headers = Enumerable.Range(1, lastColUsed).Select(i => $"Columna {i}").ToList();
                int sampleCount = 0;
                for (int row = firstRowUsed; row <= lastRowUsed && sampleCount < 10; row++)
                {
                    var r = worksheet.Row(row);
                    var rowData = new List<string>();
                    for (int col = 1; col <= lastColUsed; col++)
                    {
                        rowData.Add(r.Cell(col).GetString().Trim());
                    }
                    if (rowData.Any(c => !string.IsNullOrEmpty(c)))
                    {
                        result.SampleRows.Add(rowData);
                        sampleCount++;
                    }
                }
            }

            result.TotalEstimatedRows = lastRowUsed - firstRowUsed + (request.HasHeader ? 0 : 1);
        }

        return result;
    }

    #endregion

    #region EXECUTE

    public async Task<DataImportJobDto> ExecuteImportAsync(
        Stream stream,
        string fileName,
        ExecuteImportRequestDto request,
        string currentUser,
        CancellationToken cancellationToken = default)
    {
        var provider = _providers.FirstOrDefault(p => p.Supports(request.EntityName));
        if (provider == null)
        {
            throw new InvalidOperationException($"No se encontró un proveedor de importación registrado para la entidad '{request.EntityName}'.");
        }

        var job = DataImportJob.Iniciar(
            nombreArchivo: fileName,
            tipoRegistro: request.EntityName,
            tamanoBytes: stream.CanSeek ? stream.Length : 0,
            modoDuplicados: request.DuplicateMode,
            permitirDuplicados: request.DuplicateMode.Equals("Permitir", StringComparison.OrdinalIgnoreCase) || request.DuplicateMode.Equals("Upsert", StringComparison.OrdinalIgnoreCase),
            creadoPor: currentUser,
            mapeoCamposJson: JsonSerializer.Serialize(request.ColumnMapping),
            parametrosDelimitadorJson: JsonSerializer.Serialize(new { request.Delimiter, request.QuoteChar }));

        await _context.DataImportJobs.AddAsync(job, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            var rawRows = await ReadAllRowsAsync(stream, fileName, request.Delimiter, cancellationToken);
            if (rawRows.Count <= 1)
            {
                job.Finalizar(0, 0, 0, 0);
                await _context.SaveChangesAsync(cancellationToken);
                return MapToDto(job);
            }

            var headers = rawRows[0];
            var dataRows = rawRows.Skip(1).ToList();

            var mappedRows = new List<Dictionary<string, string>>();

            for (int rIdx = 0; rIdx < dataRows.Count; rIdx++)
            {
                var rowData = dataRows[rIdx];
                var rowDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                for (int cIdx = 0; cIdx < headers.Count && cIdx < rowData.Count; cIdx++)
                {
                    var fileHeader = headers[cIdx];
                    if (request.ColumnMapping.TryGetValue(fileHeader, out var systemField) && !string.IsNullOrWhiteSpace(systemField))
                    {
                        rowDict[systemField] = rowData[cIdx];
                    }
                    else
                    {
                        rowDict[fileHeader] = rowData[cIdx];
                    }
                }

                mappedRows.Add(rowDict);
            }

            var result = await provider.ImportAsync(request.EntityName, mappedRows, request.DuplicateMode, cancellationToken);

            foreach (var err in result.Errores)
            {
                job.AgregarError(err.Fila, err.Mensaje, err.ClaveIdentificador, err.Columna, err.ValorOriginal);
            }

            job.Finalizar(result.TotalProcesados, result.TotalExitosos, result.TotalFallidos, result.TotalParciales);
            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(job);
        }
        catch (Exception ex)
        {
            job.AgregarError(0, $"Error crítico general al procesar la importación: {ex.Message}");
            job.Finalizar(0, 0, 1, 0);
            await _context.SaveChangesAsync(cancellationToken);
            return MapToDto(job);
        }
    }

    #endregion

    #region QUERIES

    public async Task<List<DataImportJobDto>> GetRecentJobsAsync(int limit = 50, CancellationToken cancellationToken = default)
    {
        var jobs = await _context.DataImportJobs
            .AsNoTracking()
            .Include(j => j.Errores)
            .OrderByDescending(j => j.FechaCreacion)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return jobs.Select(MapToDto).ToList();
    }

    public async Task<DataImportJobDto?> GetJobByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var job = await _context.DataImportJobs
            .AsNoTracking()
            .Include(j => j.Errores)
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);

        return job == null ? null : MapToDto(job);
    }

    public async Task<bool> DeleteJobAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var job = await _context.DataImportJobs.FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
        if (job == null) return false;

        _context.DataImportJobs.Remove(job);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region HELPERS

    private async Task<List<List<string>>> ReadAllRowsAsync(Stream stream, string fileName, string? customDelimiter, CancellationToken ct)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var rows = new List<List<string>>();

        if (ext == ".csv" || ext == ".txt")
        {
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 8192, leaveOpen: true);
            string? firstLine = await reader.ReadLineAsync(ct);
            if (string.IsNullOrWhiteSpace(firstLine)) return rows;

            char delimiter = !string.IsNullOrEmpty(customDelimiter)
                ? customDelimiter[0]
                : DetectDelimiter(new List<string> { firstLine });

            rows.Add(ParseDelimitedLine(firstLine, delimiter));

            string? line;
            while ((line = await reader.ReadLineAsync(ct)) != null)
            {
                if (!string.IsNullOrWhiteSpace(line))
                    rows.Add(ParseDelimitedLine(line, delimiter));
            }
        }
        else if (ext == ".xlsx")
        {
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.FirstOrDefault();
            if (worksheet == null || worksheet.IsEmpty()) return rows;

            int firstRowUsed = worksheet.FirstRowUsed()?.RowNumber() ?? 1;
            int lastRowUsed = worksheet.LastRowUsed()?.RowNumber() ?? 1;
            int lastColUsed = worksheet.LastColumnUsed()?.ColumnNumber() ?? 1;

            for (int r = firstRowUsed; r <= lastRowUsed; r++)
            {
                var row = worksheet.Row(r);
                var rowData = new List<string>();
                for (int c = 1; c <= lastColUsed; c++)
                {
                    rowData.Add(row.Cell(c).GetString().Trim());
                }
                if (rowData.Any(x => !string.IsNullOrEmpty(x)))
                {
                    rows.Add(rowData);
                }
            }
        }

        return rows;
    }

    private static char DetectDelimiter(List<string> sampleLines)
    {
        char[] candidates = { ',', ';', '\t', '|' };
        var bestChar = ',';
        int maxAvgCount = 0;

        foreach (var c in candidates)
        {
            int total = sampleLines.Sum(l => l.Count(ch => ch == c));
            int avg = total / Math.Max(1, sampleLines.Count);
            if (avg > maxAvgCount)
            {
                maxAvgCount = avg;
                bestChar = c;
            }
        }

        return bestChar;
    }

    private static List<string> ParseDelimitedLine(string line, char delimiter)
    {
        var result = new List<string>();
        if (string.IsNullOrEmpty(line)) return result;

        var sb = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];

            if (c == '\"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '\"')
                {
                    sb.Append('\"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == delimiter && !inQuotes)
            {
                result.Add(sb.ToString().Trim());
                sb.Clear();
            }
            else
            {
                sb.Append(c);
            }
        }

        result.Add(sb.ToString().Trim());
        return result;
    }

    private static DataImportJobDto MapToDto(DataImportJob job)
    {
        Dictionary<string, string>? mapping = null;
        if (!string.IsNullOrWhiteSpace(job.MapeoCamposJson))
        {
            try
            {
                mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(job.MapeoCamposJson);
            }
            catch { }
        }

        return new DataImportJobDto
        {
            Id = job.Id,
            NombreArchivo = job.NombreArchivo,
            TipoRegistro = job.TipoRegistro,
            TamanoBytes = job.TamanoBytes,
            Estado = job.Estado,
            ModoDuplicados = job.ModoDuplicados,
            PermitirDuplicados = job.PermitirDuplicados,
            CreadoPor = job.CreadoPor,
            FechaCreacion = job.FechaCreacion,
            FechaFinalizacion = job.FechaFinalizacion,
            TotalProcesados = job.TotalProcesados,
            TotalExitosos = job.TotalExitosos,
            TotalFallidos = job.TotalFallidos,
            TotalParciales = job.TotalParciales,
            MapeoCampos = mapping,
            Errores = job.Errores.Select(e => new DataImportJobErrorDto
            {
                Id = e.Id,
                Fila = e.Fila,
                ClaveIdentificador = e.ClaveIdentificador,
                Columna = e.Columna,
                Mensaje = e.Mensaje,
                ValorOriginal = e.ValorOriginal
            }).ToList()
        };
    }

    #endregion
}

