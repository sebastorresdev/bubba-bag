using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Services;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

public class ServicioExcelService : IServicioExcelService
{
    private readonly IServicioCampoDbContext _context;

    public ServicioExcelService(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> GenerarPlantillaExcelAsync(CancellationToken cancellationToken = default)
    {
        using var workbook = new XLWorkbook();

        // 1. Hoja Principal: Servicios
        var wsServicios = workbook.Worksheets.Add("Servicios");

        // Encabezados
        wsServicios.Cell(1, 1).Value = "Código (*)";
        wsServicios.Cell(1, 2).Value = "Nombre del Servicio (*)";
        wsServicios.Cell(1, 3).Value = "Catálogo (*)";
        wsServicios.Cell(1, 4).Value = "Duración (Minutos)";
        wsServicios.Cell(1, 5).Value = "Código Externo";
        wsServicios.Cell(1, 6).Value = "Descripción";

        // Estilo encabezado Dynamics 365
        var headerRange = wsServicios.Range("A1:F1");
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Font.FontSize = 11;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#0078D4");
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        headerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        wsServicios.Row(1).Height = 28;

        // 2. Hoja de Catálogos para referencia y dropdown
        var catalogos = await _context.CatalogosServicio
            .Where(c => c.Activo)
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);

        var wsCatalogos = workbook.Worksheets.Add("Catálogos Disponibles");
        wsCatalogos.Cell(1, 1).Value = "Nombre del Catálogo";
        wsCatalogos.Cell(1, 2).Value = "ID (Referencial)";

        var catHeader = wsCatalogos.Range("A1:B1");
        catHeader.Style.Font.Bold = true;
        catHeader.Style.Font.FontColor = XLColor.White;
        catHeader.Style.Fill.BackgroundColor = XLColor.FromHtml("#5C2E91");
        catHeader.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        catHeader.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        wsCatalogos.Row(1).Height = 24;

        int catRow = 2;
        foreach (var cat in catalogos)
        {
            wsCatalogos.Cell(catRow, 1).Value = cat.Nombre;
            wsCatalogos.Cell(catRow, 2).Value = cat.Id.ToString();
            catRow++;
        }
        wsCatalogos.Columns().AdjustToContents();

        // Configurar Validación de Datos (Dropdown) en la columna Catálogo de la hoja Servicios
        if (catalogos.Count > 0)
        {
            int maxCatRow = catalogos.Count + 1;
            var validation = wsServicios.Range("C2:C500").CreateDataValidation();
            validation.List($"='Catálogos Disponibles'!$A$2:$A${maxCatRow}", true);
            validation.InputTitle = "Seleccionar Catálogo";
            validation.InputMessage = "Elija un catálogo válido registrado en el sistema.";
            validation.ErrorTitle = "Catálogo No Válido";
            validation.ErrorMessage = "El valor debe coincidir con un catálogo de la lista desplegable.";
        }

        // Filas de Ejemplo
        var primerCatalogo = catalogos.FirstOrDefault()?.Nombre ?? "DIRECTV";
        wsServicios.Cell(2, 1).Value = "IB01";
        wsServicios.Cell(2, 2).Value = "Instalación Básica Domiciliaria";
        wsServicios.Cell(2, 3).Value = primerCatalogo;
        wsServicios.Cell(2, 4).Value = 60;
        wsServicios.Cell(2, 5).Value = "EXT-IB01";
        wsServicios.Cell(2, 6).Value = "Instalación estándar de decodificador en domicilio";

        wsServicios.Cell(3, 1).Value = "L33";
        wsServicios.Cell(3, 2).Value = "Servicio Preventivo Técnico";
        wsServicios.Cell(3, 3).Value = primerCatalogo;
        wsServicios.Cell(3, 4).Value = 90;
        wsServicios.Cell(3, 5).Value = "EXT-L33";
        wsServicios.Cell(3, 6).Value = "Mantenimiento y calibración periódica de señal";

        wsServicios.Range("A2:F3").Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin);
        wsServicios.Range("A2:F3").Style.Border.SetInsideBorder(XLBorderStyleValues.Thin);
        wsServicios.Range("A2:F3").Style.Border.OutsideBorderColor = XLColor.FromHtml("#E1DFDD");
        wsServicios.Range("A2:F3").Style.Border.InsideBorderColor = XLColor.FromHtml("#E1DFDD");

        wsServicios.Columns(1, 6).AdjustToContents(15.0, 50.0);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public async Task<ImportarServiciosResultadoDto> ImportarServiciosDesdeExcelAsync(
        Stream excelStream,
        CancellationToken cancellationToken = default)
    {
        using var workbook = new XLWorkbook(excelStream);
        var ws = workbook.Worksheets.FirstOrDefault(w => w.Name.Equals("Servicios", StringComparison.OrdinalIgnoreCase))
                 ?? workbook.Worksheets.FirstOrDefault();

        if (ws == null)
        {
            return new ImportarServiciosResultadoDto(
                0, 0, 0, 0,
                new List<string> { "El archivo no contiene ninguna hoja válida de servicios." },
                new List<string>()
            );
        }

        // Mapear encabezados dinámicamente en la fila 1
        int colCodigo = 0;
        int colNombre = 0;
        int colCatalogo = 0;
        int colDuracion = 0;
        int colCodExt = 0;
        int colDesc = 0;

        var lastColumn = ws.LastColumnUsed()?.ColumnNumber() ?? 0;
        for (int col = 1; col <= lastColumn; col++)
        {
            var headerText = ws.Cell(1, col).GetString()?.Trim().ToLowerInvariant() ?? "";
            if (headerText.Contains("código") || headerText.Contains("codigo") || headerText.Contains("code"))
            {
                if (headerText.Contains("externo") || headerText.Contains("ext"))
                    colCodExt = col;
                else
                    colCodigo = col;
            }
            else if (headerText.Contains("nombre") || headerText.Contains("servicio"))
            {
                colNombre = col;
            }
            else if (headerText.Contains("catálogo") || headerText.Contains("catalogo"))
            {
                colCatalogo = col;
            }
            else if (headerText.Contains("duración") || headerText.Contains("duracion") || headerText.Contains("minuto"))
            {
                colDuracion = col;
            }
            else if (headerText.Contains("descripci"))
            {
                colDesc = col;
            }
        }

        // Fallbacks si los nombres exactos cambiaron
        if (colCodigo == 0) colCodigo = 1;
        if (colNombre == 0) colNombre = 2;
        if (colCatalogo == 0) colCatalogo = 3;
        if (colDuracion == 0) colDuracion = 4;
        if (colCodExt == 0) colCodExt = 5;
        if (colDesc == 0) colDesc = 6;

        // Cargar Catálogos existentes
        var catalogos = await _context.CatalogosServicio.ToListAsync(cancellationToken);
        var catalogoMapByName = catalogos.ToDictionary(c => c.Nombre.Trim().ToUpperInvariant(), c => c);
        var catalogoMapById = catalogos.ToDictionary(c => c.Id, c => c);

        // Cargar Servicios existentes para update o create
        var serviciosExistentes = await _context.Servicios.ToListAsync(cancellationToken);
        var servicioMapByCodigo = serviciosExistentes.ToDictionary(s => s.Codigo.Trim().ToUpperInvariant(), s => s);

        var codigosEnArchivo = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var errores = new List<string>();
        var advertencias = new List<string>();

        int totalLeidos = 0;
        int totalImportados = 0;
        int totalActualizados = 0;
        int totalOmitidos = 0;

        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

        for (int r = 2; r <= lastRow; r++)
        {
            var codigoRaw = ws.Cell(r, colCodigo).GetString()?.Trim();
            var nombreRaw = ws.Cell(r, colNombre).GetString()?.Trim();
            var catalogoRaw = ws.Cell(r, colCatalogo).GetString()?.Trim();
            var duracionRaw = colDuracion > 0 ? ws.Cell(r, colDuracion).GetString()?.Trim() : null;
            var codExtRaw = colCodExt > 0 ? ws.Cell(r, colCodExt).GetString()?.Trim() : null;
            var descRaw = colDesc > 0 ? ws.Cell(r, colDesc).GetString()?.Trim() : null;

            // Fila vacía al final del archivo
            if (string.IsNullOrWhiteSpace(codigoRaw) &&
                string.IsNullOrWhiteSpace(nombreRaw) &&
                string.IsNullOrWhiteSpace(catalogoRaw))
            {
                continue;
            }

            totalLeidos++;

            // Validar Código
            if (string.IsNullOrWhiteSpace(codigoRaw))
            {
                errores.Add($"[Fila {r}]: El campo 'Código' es obligatorio.");
                totalOmitidos++;
                continue;
            }

            var codigoNorm = codigoRaw.ToUpperInvariant();

            // Validar Duplicados dentro del mismo archivo
            if (!codigosEnArchivo.Add(codigoNorm))
            {
                errores.Add($"[Fila {r} - Código '{codigoNorm}']: El código está duplicado en el mismo archivo Excel.");
                totalOmitidos++;
                continue;
            }

            // Validar Nombre
            if (string.IsNullOrWhiteSpace(nombreRaw))
            {
                errores.Add($"[Fila {r} - Código '{codigoNorm}']: El campo 'Nombre del Servicio' es obligatorio.");
                totalOmitidos++;
                continue;
            }

            // Validar Catálogo
            if (string.IsNullOrWhiteSpace(catalogoRaw))
            {
                errores.Add($"[Fila {r} - Código '{codigoNorm}']: Debe indicar el catálogo al que pertenece el servicio.");
                totalOmitidos++;
                continue;
            }

            // Resolver Catálogo por Nombre o por GUID
            CatalogoServicio? catalogo = null;
            if (catalogoMapByName.TryGetValue(catalogoRaw.ToUpperInvariant(), out var catByName))
            {
                catalogo = catByName;
            }
            else if (Guid.TryParse(catalogoRaw, out var catId) && catalogoMapById.TryGetValue(catId, out var catById))
            {
                catalogo = catById;
            }

            if (catalogo == null)
            {
                errores.Add($"[Fila {r} - Código '{codigoNorm}']: El catálogo '{catalogoRaw}' no existe en el sistema. Debe registrarlo previamente o seleccionarlo de la lista.");
                totalOmitidos++;
                continue;
            }

            // Duración
            int duracion = 60;
            if (!string.IsNullOrWhiteSpace(duracionRaw) && int.TryParse(duracionRaw, out var d) && d > 0)
            {
                duracion = d;
            }

            // Actualizar o Crear
            if (servicioMapByCodigo.TryGetValue(codigoNorm, out var servicioExistente))
            {
                servicioExistente.Actualizar(
                    nombreRaw,
                    catalogo.Id,
                    duracion,
                    descRaw,
                    codExtRaw
                );
                if (!servicioExistente.Activo)
                {
                    servicioExistente.Activar();
                }
                advertencias.Add($"[Fila {r} - Código '{codigoNorm}']: Se actualizó el servicio existente con nuevos datos.");
                totalActualizados++;
            }
            else
            {
                var nuevoServicio = Servicio.Crear(
                    codigoNorm,
                    nombreRaw,
                    catalogo.Id,
                    duracion,
                    descRaw,
                    codExtRaw
                );
                _context.Servicios.Add(nuevoServicio);
                servicioMapByCodigo[codigoNorm] = nuevoServicio;
                totalImportados++;
            }
        }

        if (totalImportados > 0 || totalActualizados > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new ImportarServiciosResultadoDto(
            totalLeidos,
            totalImportados,
            totalActualizados,
            totalOmitidos,
            errores,
            advertencias
        );
    }
}
