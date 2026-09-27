using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Services;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Importaciones;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

public class DataImportEngineService : IDataImportEngineService
{
    private readonly IServicioCampoDbContext _context;
    private readonly IEntityImportMetadataService _metadataService;

    public DataImportEngineService(
        IServicioCampoDbContext context,
        IEntityImportMetadataService metadataService)
    {
        _context = context;
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
            {
                return result;
            }

            // Detect delimiter if not specified
            char delimiterChar;
            if (!string.IsNullOrWhiteSpace(request.Delimiter))
            {
                delimiterChar = request.Delimiter[0];
            }
            else
            {
                delimiterChar = DetectCsvDelimiter(lines.Take(5).ToList());
            }

            result.DetectedDelimiter = delimiterChar == '\t' ? "\\t" : delimiterChar.ToString();
            result.DetectedQuoteChar = string.IsNullOrEmpty(request.QuoteChar) ? "\"" : request.QuoteChar;
            char quoteChar = result.DetectedQuoteChar.Length > 0 ? result.DetectedQuoteChar[0] : '"';

            int startIndex = 0;
            if (request.HasHeader && lines.Count > 0)
            {
                result.Headers = ParseCsvLine(lines[0], delimiterChar, quoteChar);
                startIndex = 1;
            }
            else if (lines.Count > 0)
            {
                var firstRow = ParseCsvLine(lines[0], delimiterChar, quoteChar);
                for (int i = 0; i < firstRow.Count; i++)
                    result.Headers.Add($"Columna {i + 1}");
            }

            for (int i = startIndex; i < lines.Count && result.SampleRows.Count < 5; i++)
            {
                var rowData = ParseCsvLine(lines[i], delimiterChar, quoteChar);
                result.SampleRows.Add(rowData);
            }

            result.TotalEstimatedRows = Math.Max(0, lines.Count - (request.HasHeader ? 1 : 0));
        }
        else
        {
            // Excel (.xlsx, .xls)
            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheets.FirstOrDefault(w => !w.Name.StartsWith("_")) ?? workbook.Worksheets.FirstOrDefault();
            if (ws == null) return result;

            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            var lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 1;

            if (request.HasHeader && lastRow >= 1)
            {
                for (int col = 1; col <= lastCol; col++)
                {
                    var val = ws.Cell(1, col).GetString()?.Trim() ?? $"Columna {col}";
                    result.Headers.Add(string.IsNullOrWhiteSpace(val) ? $"Columna {col}" : val);
                }
            }

            int startRow = request.HasHeader ? 2 : 1;
            for (int r = startRow; r <= lastRow && result.SampleRows.Count < 5; r++)
            {
                var rowCells = new List<string>();
                for (int c = 1; c <= lastCol; c++)
                {
                    rowCells.Add(ws.Cell(r, c).GetString()?.Trim() ?? string.Empty);
                }
                result.SampleRows.Add(rowCells);
            }

            result.TotalEstimatedRows = Math.Max(0, lastRow - (request.HasHeader ? 1 : 0));
        }

        return result;
    }

    #endregion

    #region EXECUTE IMPORT

    public async Task<DataImportJobDto> ExecuteImportAsync(
        Stream stream,
        string fileName,
        ExecuteImportRequestDto request,
        string currentUser,
        CancellationToken cancellationToken = default)
    {
        long fileSize = stream.CanSeek ? stream.Length : 0;
        string mappingJson = JsonSerializer.Serialize(request.ColumnMapping);

        var job = DataImportJob.Iniciar(
            fileName,
            request.EntityName,
            fileSize,
            request.DuplicateMode,
            request.DuplicateMode.Equals("Upsert", StringComparison.OrdinalIgnoreCase),
            currentUser,
            mappingJson,
            request.Delimiter);

        try
        {
            var rowsData = ExtractRowsData(stream, fileName, request);

            if (rowsData.Count == 0)
            {
                job.AgregarError(0, "El archivo no contiene filas de datos para procesar.");
                job.Finalizar(0, 0, 1);
            }
            else
            {
                switch (request.EntityName.ToLowerInvariant())
                {
                    case "producto":
                        await ImportarProductosAsync(job, rowsData, request.ColumnMapping, request.DuplicateMode, cancellationToken);
                        break;
                    case "categoria":
                        await ImportarCategoriasAsync(job, rowsData, request.ColumnMapping, request.DuplicateMode, cancellationToken);
                        break;
                    case "unidadmedida":
                        await ImportarUnidadesMedidaAsync(job, rowsData, request.ColumnMapping, request.DuplicateMode, cancellationToken);
                        break;
                    case "cliente":
                        await ImportarClientesAsync(job, rowsData, request.ColumnMapping, request.DuplicateMode, cancellationToken);
                        break;
                    default:
                        job.AgregarError(0, $"La entidad '{request.EntityName}' no tiene un procesador registrado.");
                        job.Finalizar(0, 0, 1);
                        break;
                }
            }
        }
        catch (Exception ex)
        {
            job.AgregarError(0, $"Error crítico al procesar la importación: {ex.Message}");
            job.Finalizar(0, 0, 1);
        }

        try
        {
            _context.DataImportJobs.Add(job);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception)
        {
            try
            {
                if (_context is DbContext dbContext)
                {
                    dbContext.ChangeTracker.Clear();
                }
                _context.DataImportJobs.Add(job);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception fallbackEx)
            {
                System.Diagnostics.Debug.WriteLine($"Error al persistir DataImportJob: {fallbackEx.Message}");
            }
        }

        return MapToDto(job);
    }

    #endregion

    #region ENTITY PROCESSORS

    private async Task ImportarProductosAsync(
        DataImportJob job,
        List<RowDataContainer> rows,
        Dictionary<string, string> columnMapping,
        string duplicateMode,
        CancellationToken ct)
    {
        var reversedMapping = BuildReversedMapping(columnMapping);

        var categoriasDb = await _context.CategoriasProducto.ToListAsync(ct);
        var unidadesDb = await _context.UnidadesMedida.ToListAsync(ct);
        var productosDb = await _context.Productos.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        foreach (var row in rows)
        {
            string? codigo = row.GetValue(reversedMapping, "Codigo")?.Trim().ToUpperInvariant();
            string? nombre = row.GetValue(reversedMapping, "Nombre")?.Trim();

            if (string.IsNullOrWhiteSpace(codigo) && string.IsNullOrWhiteSpace(nombre))
                continue;

            if (string.IsNullOrWhiteSpace(codigo))
            {
                job.AgregarError(row.RowNumber, "El campo Código es obligatorio.", codigo, "Codigo");
                fallidos++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(nombre))
            {
                job.AgregarError(row.RowNumber, "El Nombre del producto es obligatorio.", codigo, "Nombre");
                fallidos++;
                continue;
            }

            // Tipo
            var tipoStr = row.GetValue(reversedMapping, "Tipo")?.Trim();
            var tipo = TipoProducto.Inventario;
            if (!string.IsNullOrWhiteSpace(tipoStr))
            {
                if (tipoStr.Equals("Servicio", StringComparison.OrdinalIgnoreCase)) tipo = TipoProducto.Servicio;
                else if (tipoStr.Contains("No", StringComparison.OrdinalIgnoreCase)) tipo = TipoProducto.NoInventario;
            }

            // Categoría
            var catStr = row.GetValue(reversedMapping, "Categoria")?.Trim();
            string? catFinal = null;
            if (!string.IsNullOrWhiteSpace(catStr))
            {
                var catDb = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(catStr, StringComparison.OrdinalIgnoreCase));
                if (catDb == null)
                {
                    job.AgregarError(row.RowNumber, $"La categoría '{catStr}' no existe en el catálogo.", codigo, "Categoria", catStr);
                    fallidos++;
                    continue;
                }
                catFinal = catDb.Nombre;
            }

            // Unidad de Medida
            var umStr = row.GetValue(reversedMapping, "UnidadMedida")?.Trim();
            if (string.IsNullOrWhiteSpace(umStr))
            {
                job.AgregarError(row.RowNumber, "La Unidad de Medida es obligatoria.", codigo, "UnidadMedida");
                fallidos++;
                continue;
            }

            var umDb = unidadesDb.FirstOrDefault(u =>
                u.Nombre.Equals(umStr, StringComparison.OrdinalIgnoreCase) ||
                u.Codigo.Equals(umStr, StringComparison.OrdinalIgnoreCase) ||
                u.Abreviatura.Equals(umStr, StringComparison.OrdinalIgnoreCase));

            if (umDb == null)
            {
                job.AgregarError(row.RowNumber, $"La unidad de medida '{umStr}' no existe en el catálogo.", codigo, "UnidadMedida", umStr);
                fallidos++;
                continue;
            }

            decimal precioBase = ParseDecimal(row.GetValue(reversedMapping, "PrecioBase"));
            decimal costoActual = ParseDecimal(row.GetValue(reversedMapping, "CostoActual"));
            decimal costoEstandar = ParseDecimal(row.GetValue(reversedMapping, "CostoEstandar"));
            bool esSerializado = ParseBoolean(row.GetValue(reversedMapping, "EsSerializado"));
            bool afectoImpuesto = ParseBoolean(row.GetValue(reversedMapping, "AfectoImpuesto"), defaultValue: true);
            string? codigoBarras = row.GetValue(reversedMapping, "CodigoBarras")?.Trim();
            string? proveedor = row.GetValue(reversedMapping, "ProveedorDefecto")?.Trim();
            string? descripcion = row.GetValue(reversedMapping, "Descripcion")?.Trim();

            var prodExistente = productosDb.FirstOrDefault(p => p.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));

            if (prodExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    job.AgregarError(row.RowNumber, $"El producto con código '{codigo}' ya existe.", codigo, "Codigo");
                    fallidos++;
                    continue;
                }
                else if (duplicateMode.Equals("Skip", StringComparison.OrdinalIgnoreCase))
                {
                    parciales++;
                    continue;
                }
                else
                {
                    // Upsert
                    prodExistente.Actualizar(
                        nombre,
                        catFinal,
                        umDb.Nombre,
                        esSerializado,
                        descripcion,
                        tipo,
                        precioBase,
                        prodExistente.CatalogoId,
                        codigoBarras,
                        descripcion,
                        costoActual,
                        costoEstandar,
                        afectoImpuesto,
                        proveedor,
                        prodExistente.ListaPreciosPredeterminadaId);
                    exitosos++;
                }
            }
            else
            {
                var nuevo = Producto.Crear(
                    codigo,
                    nombre,
                    catFinal,
                    umDb.Nombre,
                    esSerializado,
                    descripcion,
                    tipo,
                    precioBase,
                    null,
                    codigoBarras,
                    descripcion,
                    costoActual,
                    costoEstandar,
                    afectoImpuesto,
                    proveedor);
                _context.Productos.Add(nuevo);
                productosDb.Add(nuevo);
                exitosos++;
            }
        }

        try
        {
            await _context.SaveChangesAsync(ct);
            job.Finalizar(rows.Count, exitosos, fallidos, parciales);
        }
        catch (Exception dbEx)
        {
            if (_context is DbContext dbContext)
            {
                dbContext.ChangeTracker.Clear();
            }

            var detalle = FormatearErrorBaseDatos(dbEx);
            job.AgregarError(0, $"Error al guardar productos en la base de datos: {detalle}");
            job.Finalizar(rows.Count, 0, rows.Count, 0);
        }
    }

    private async Task ImportarCategoriasAsync(
        DataImportJob job,
        List<RowDataContainer> rows,
        Dictionary<string, string> columnMapping,
        string duplicateMode,
        CancellationToken ct)
    {
        var reversedMapping = BuildReversedMapping(columnMapping);
        var categoriasDb = await _context.CategoriasProducto.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        foreach (var row in rows)
        {
            string? nombre = row.GetValue(reversedMapping, "Nombre")?.Trim();
            string? descripcion = row.GetValue(reversedMapping, "Descripcion")?.Trim();

            if (string.IsNullOrWhiteSpace(nombre))
            {
                job.AgregarError(row.RowNumber, "El Nombre de la categoría es obligatorio.", null, "Nombre");
                fallidos++;
                continue;
            }

            var catExistente = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase));
            if (catExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    job.AgregarError(row.RowNumber, $"La categoría '{nombre}' ya existe.", nombre, "Nombre");
                    fallidos++;
                    continue;
                }
                else if (duplicateMode.Equals("Skip", StringComparison.OrdinalIgnoreCase))
                {
                    parciales++;
                    continue;
                }
                else
                {
                    catExistente.Actualizar(nombre, catExistente.CategoriaPadreId, descripcion);
                    exitosos++;
                }
            }
            else
            {
                var nueva = CategoriaProducto.Crear(nombre, null, descripcion);
                _context.CategoriasProducto.Add(nueva);
                categoriasDb.Add(nueva);
                exitosos++;
            }
        }

        try
        {
            await _context.SaveChangesAsync(ct);
            job.Finalizar(rows.Count, exitosos, fallidos, parciales);
        }
        catch (Exception dbEx)
        {
            if (_context is DbContext dbContext)
            {
                dbContext.ChangeTracker.Clear();
            }

            var detalle = FormatearErrorBaseDatos(dbEx);
            job.AgregarError(0, $"Error al guardar categorías en la base de datos: {detalle}");
            job.Finalizar(rows.Count, 0, rows.Count, 0);
        }
    }

    private async Task ImportarUnidadesMedidaAsync(
        DataImportJob job,
        List<RowDataContainer> rows,
        Dictionary<string, string> columnMapping,
        string duplicateMode,
        CancellationToken ct)
    {
        var reversedMapping = BuildReversedMapping(columnMapping);
        var unidadesDb = await _context.UnidadesMedida.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        foreach (var row in rows)
        {
            string? codigo = row.GetValue(reversedMapping, "Codigo")?.Trim().ToUpperInvariant();
            string? nombre = row.GetValue(reversedMapping, "Nombre")?.Trim();
            string? abrev = row.GetValue(reversedMapping, "Abreviatura")?.Trim();
            bool permiteDecimales = ParseBoolean(row.GetValue(reversedMapping, "PermiteDecimales"));
            string? desc = row.GetValue(reversedMapping, "Descripcion")?.Trim();

            if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(abrev))
            {
                job.AgregarError(row.RowNumber, "Código, Nombre y Abreviatura son obligatorios para Unidad de Medida.", codigo);
                fallidos++;
                continue;
            }

            var umExistente = unidadesDb.FirstOrDefault(u => u.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));
            if (umExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    job.AgregarError(row.RowNumber, $"La unidad con código '{codigo}' ya existe.", codigo);
                    fallidos++;
                    continue;
                }
                else if (duplicateMode.Equals("Skip", StringComparison.OrdinalIgnoreCase))
                {
                    parciales++;
                    continue;
                }
                else
                {
                    umExistente.Actualizar(nombre, abrev, permiteDecimales, desc);
                    exitosos++;
                }
            }
            else
            {
                var nueva = UnidadMedida.Crear(codigo, nombre, abrev, permiteDecimales, desc);
                _context.UnidadesMedida.Add(nueva);
                unidadesDb.Add(nueva);
                exitosos++;
            }
        }

        try
        {
            await _context.SaveChangesAsync(ct);
            job.Finalizar(rows.Count, exitosos, fallidos, parciales);
        }
        catch (Exception dbEx)
        {
            if (_context is DbContext dbContext)
            {
                dbContext.ChangeTracker.Clear();
            }

            var detalle = FormatearErrorBaseDatos(dbEx);
            job.AgregarError(0, $"Error al guardar unidades de medida en la base de datos: {detalle}");
            job.Finalizar(rows.Count, 0, rows.Count, 0);
        }
    }

    private async Task ImportarClientesAsync(
        DataImportJob job,
        List<RowDataContainer> rows,
        Dictionary<string, string> columnMapping,
        string duplicateMode,
        CancellationToken ct)
    {
        var reversedMapping = BuildReversedMapping(columnMapping);
        var clientesDb = await _context.Clientes.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        foreach (var row in rows)
        {
            string? doc = row.GetValue(reversedMapping, "DocumentoIdentidad")?.Trim();
            string? nombres = row.GetValue(reversedMapping, "Nombres")?.Trim();
            string? apellidos = row.GetValue(reversedMapping, "Apellidos")?.Trim();
            string? tel = row.GetValue(reversedMapping, "TelefonoPrincipal")?.Trim();
            string? direccion = row.GetValue(reversedMapping, "Direccion")?.Trim();
            string? tipoPersona = row.GetValue(reversedMapping, "TipoPersona")?.Trim() ?? "NATURAL";
            string? tipoDoc = row.GetValue(reversedMapping, "TipoDocumento")?.Trim() ?? "DNI";
            string? email = row.GetValue(reversedMapping, "Email")?.Trim();
            string? tel2 = row.GetValue(reversedMapping, "TelefonoSecundario")?.Trim();
            string? ubigeo = row.GetValue(reversedMapping, "UbigeoCodigo")?.Trim() ?? "";
            string? refUbicacion = row.GetValue(reversedMapping, "ReferenciaUbicacion")?.Trim();

            if (string.IsNullOrWhiteSpace(doc) || string.IsNullOrWhiteSpace(nombres) || string.IsNullOrWhiteSpace(tel) || string.IsNullOrWhiteSpace(direccion))
            {
                job.AgregarError(row.RowNumber, "Documento de Identidad, Nombres, Teléfono Principal y Dirección son obligatorios.", doc);
                fallidos++;
                continue;
            }

            var cliExistente = clientesDb.FirstOrDefault(c => c.DocumentoIdentidad.Equals(doc, StringComparison.OrdinalIgnoreCase));
            if (cliExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    job.AgregarError(row.RowNumber, $"El cliente con documento '{doc}' ya existe.", doc);
                    fallidos++;
                    continue;
                }
                else if (duplicateMode.Equals("Skip", StringComparison.OrdinalIgnoreCase))
                {
                    parciales++;
                    continue;
                }
                else
                {
                    cliExistente.Actualizar(
                        nombres,
                        apellidos,
                        tel,
                        direccion,
                        ubigeo,
                        tipoDoc,
                        tipoPersona,
                        null,
                        tel2,
                        email,
                        refUbicacion);
                    exitosos++;
                }
            }
            else
            {
                string codigoCli = "CLI-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpperInvariant();
                var nuevo = Cliente.Crear(
                    codigoCli,
                    doc,
                    nombres,
                    apellidos,
                    tel,
                    direccion,
                    ubigeo,
                    esClienteFacturacion: false,
                    esClienteServicio: true,
                    tipoDocumento: tipoDoc,
                    tipoPersona: tipoPersona,
                    razonSocial: null,
                    telefonoSecundario: tel2,
                    email: email,
                    referencia: refUbicacion);
                _context.Clientes.Add(nuevo);
                clientesDb.Add(nuevo);
                exitosos++;
            }
        }

        try
        {
            await _context.SaveChangesAsync(ct);
            job.Finalizar(rows.Count, exitosos, fallidos, parciales);
        }
        catch (Exception dbEx)
        {
            if (_context is DbContext dbContext)
            {
                dbContext.ChangeTracker.Clear();
            }

            var detalle = FormatearErrorBaseDatos(dbEx);
            job.AgregarError(0, $"Error al guardar clientes en la base de datos: {detalle}");
            job.Finalizar(rows.Count, 0, rows.Count, 0);
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

    public async Task<DataImportJobDto?> GetJobByIdAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _context.DataImportJobs
            .AsNoTracking()
            .Include(j => j.Errores)
            .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);

        return job == null ? null : MapToDto(job);
    }

    public async Task<bool> DeleteJobAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _context.DataImportJobs
            .Include(j => j.Errores)
            .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);

        if (job == null) return false;

        _context.DataImportJobs.Remove(job);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region HELPERS

    private static Dictionary<string, List<string>> BuildReversedMapping(Dictionary<string, string> columnMapping)
    {
        // input: ExcelColumn -> SystemFieldName
        // output: SystemFieldName -> List<ExcelColumn>
        var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in columnMapping)
        {
            if (!string.IsNullOrWhiteSpace(kvp.Value) && !kvp.Value.Equals("Ignore", StringComparison.OrdinalIgnoreCase))
            {
                if (!result.TryGetValue(kvp.Value, out var list))
                {
                    list = new List<string>();
                    result[kvp.Value] = list;
                }
                list.Add(kvp.Key);
            }
        }
        return result;
    }

    private class RowDataContainer
    {
        public int RowNumber { get; set; }
        public Dictionary<string, string> ValuesByHeader { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        public string? GetValue(Dictionary<string, List<string>> systemToExcelMap, string systemFieldName)
        {
            if (systemToExcelMap.TryGetValue(systemFieldName, out var excelHeaders))
            {
                // Preferir columnas que contengan datos no vacíos
                foreach (var header in excelHeaders)
                {
                    if (ValuesByHeader.TryGetValue(header, out var val) && !string.IsNullOrWhiteSpace(val))
                    {
                        return val;
                    }
                }
                // Si ninguna tiene valor, retornar el valor de la primera columna mapeada si existe
                if (excelHeaders.Count > 0 && ValuesByHeader.TryGetValue(excelHeaders[0], out var firstVal))
                {
                    return firstVal;
                }
            }

            // Fallback directo: si la columna del Excel coincide directamente con el nombre del campo del sistema
            foreach (var kvp in ValuesByHeader)
            {
                var cleanKey = kvp.Key.Replace("*", "").Trim();
                if (cleanKey.Equals(systemFieldName, StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(kvp.Value))
                {
                    return kvp.Value;
                }
            }

            return null;
        }
    }

    private static List<RowDataContainer> ExtractRowsData(Stream stream, string fileName, ExecuteImportRequestDto request)
    {
        var result = new List<RowDataContainer>();
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        if (ext == ".csv" || ext == ".txt")
        {
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 4096, leaveOpen: true);
            string? firstLine = reader.ReadLine();
            if (string.IsNullOrWhiteSpace(firstLine)) return result;

            char delimiter = !string.IsNullOrWhiteSpace(request.Delimiter) && request.Delimiter.Length > 0
                ? (request.Delimiter == "\\t" ? '\t' : request.Delimiter[0])
                : ',';
            char quoteChar = !string.IsNullOrWhiteSpace(request.QuoteChar) && request.QuoteChar.Length > 0
                ? request.QuoteChar[0]
                : '"';

            var headers = ParseCsvLine(firstLine, delimiter, quoteChar);

            int rowNum = 1;
            string? line;
            while ((line = reader.ReadLine()) != null)
            {
                rowNum++;
                if (string.IsNullOrWhiteSpace(line)) continue;

                var cells = ParseCsvLine(line, delimiter, quoteChar);
                var rowContainer = new RowDataContainer { RowNumber = rowNum };
                for (int i = 0; i < headers.Count && i < cells.Count; i++)
                {
                    rowContainer.ValuesByHeader[headers[i]] = cells[i];
                }
                result.Add(rowContainer);
            }
        }
        else
        {
            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheets.FirstOrDefault(w => !w.Name.StartsWith("_")) ?? workbook.Worksheets.FirstOrDefault();
            if (ws == null) return result;

            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            var lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 1;

            var headers = new List<string>();
            for (int col = 1; col <= lastCol; col++)
            {
                var h = ws.Cell(1, col).GetString()?.Trim() ?? $"Columna {col}";
                headers.Add(h);
            }

            for (int r = 2; r <= lastRow; r++)
            {
                var rowContainer = new RowDataContainer { RowNumber = r };
                for (int c = 1; c <= lastCol; c++)
                {
                    rowContainer.ValuesByHeader[headers[c - 1]] = ws.Cell(r, c).GetString()?.Trim() ?? string.Empty;
                }
                result.Add(rowContainer);
            }
        }

        return result;
    }

    private static char DetectCsvDelimiter(List<string> sampleLines)
    {
        var delimiters = new[] { ',', ';', '\t', '|' };
        var counts = new Dictionary<char, int> { { ',', 0 }, { ';', 0 }, { '\t', 0 }, { '|', 0 } };

        foreach (var line in sampleLines)
        {
            bool inQuotes = false;
            foreach (char c in line)
            {
                if (c == '"') inQuotes = !inQuotes;
                else if (!inQuotes && counts.ContainsKey(c))
                {
                    counts[c]++;
                }
            }
        }

        return counts.OrderByDescending(kv => kv.Value).First().Key;
    }

    private static List<string> ParseCsvLine(string line, char delimiter, char quoteChar = '"')
    {
        var result = new List<string>();
        if (string.IsNullOrEmpty(line)) return result;

        var sb = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];

            if (c == quoteChar)
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == quoteChar)
                {
                    sb.Append(quoteChar);
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

    private static string FormatearErrorBaseDatos(Exception dbEx)
    {
        var detalle = dbEx.InnerException?.Message ?? dbEx.Message;
        if (dbEx.InnerException is Npgsql.PostgresException pgEx)
        {
            if (pgEx.SqlState == "23502")
                return $"Falta un campo obligatorio en la base de datos: columna '{pgEx.ColumnName ?? "desconocida"}' en tabla '{pgEx.TableName ?? "desconocida"}'.";
            if (pgEx.SqlState == "23505")
                return $"Ya existe un registro con clave única duplicada ({pgEx.ConstraintName}).";
            if (pgEx.SqlState == "23503")
                return $"Conflicto de integridad referencial ({pgEx.ConstraintName}): el registro o catálogo relacionado no existe.";
            if (pgEx.SqlState == "22001")
                return "Uno o más valores ingresados superan el límite de caracteres permitido.";
        }
        return detalle;
    }

    private static decimal ParseDecimal(string? val)
    {
        if (string.IsNullOrWhiteSpace(val)) return 0m;
        val = val.Replace("S/", "").Replace("$", "").Trim();
        if (decimal.TryParse(val, NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
            return result;
        if (decimal.TryParse(val, NumberStyles.Any, new CultureInfo("es-PE"), out result))
            return result;
        return 0m;
    }

    private static bool ParseBoolean(string? val, bool defaultValue = false)
    {
        if (string.IsNullOrWhiteSpace(val)) return defaultValue;
        val = val.Trim().ToLowerInvariant();
        return val == "si" || val == "sí" || val == "true" || val == "1" || val == "yes" || val == "s";
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
