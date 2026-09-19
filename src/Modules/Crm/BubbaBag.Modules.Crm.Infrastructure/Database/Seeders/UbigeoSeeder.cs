using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Domain.Ubigeos;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.Crm.Infrastructure.Database.Seeders;

public static class UbigeoSeeder
{
    public static async Task SeedAsync(CrmDbContext context, ILogger logger)
    {
        try
        {
            if (await context.Ubigeos.AnyAsync())
            {
                logger.LogInformation("[UbigeoSeeder] La tabla crm.ubigeos ya contiene registros. Omitiendo importación.");
                return;
            }

            var candidatePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "Ubigeos.xlsx"),
                Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "Ubigeo.xlsx"),
                Path.Combine(Directory.GetCurrentDirectory(), "src", "Host", "BubbaBag.Api", "Data", "Seed", "Ubigeos.xlsx"),
                Path.Combine(Directory.GetCurrentDirectory(), "Data", "Seed", "Ubigeos.xlsx"),
                @"C:\DEV_HOME\PROYECTOS\BUBBA_BAG\src\Host\BubbaBag.Api\Data\Seed\Ubigeos.xlsx",
                @"D:\PROYECTOS\bubba-bag\src\Host\BubbaBag.Api\Data\Seed\Ubigeos.xlsx"
            };

            string? excelPath = candidatePaths.FirstOrDefault(File.Exists);

            if (string.IsNullOrEmpty(excelPath))
            {
                logger.LogWarning("[UbigeoSeeder] No se encontró el archivo Excel de Ubigeos en ninguna ruta esperada. Se omitió la carga.");
                return;
            }

            logger.LogInformation("[UbigeoSeeder] Leyendo archivo Excel oficial de Ubigeos desde: {Path}", excelPath);

            var ubigeos = new List<Ubigeo>();

            using (var workbook = new XLWorkbook(excelPath))
            {
                var worksheet = workbook.Worksheets.FirstOrDefault();
                if (worksheet == null)
                {
                    logger.LogWarning("[UbigeoSeeder] El archivo Excel no contiene hojas de trabajo.");
                    return;
                }

                // Detectar fila de cabecera buscando 'IDDIST'
                int headerRowNumber = 1;
                int colIdDist = 1;
                int colNombDep = 2;
                int colNombProv = 3;
                int colNombDist = 4;
                int colNomCapital = 5;
                int colCodRegNat = 6;
                int colRegionNat = 7;

                for (int r = 1; r <= Math.Min(10, worksheet.LastRowUsed()?.RowNumber() ?? 10); r++)
                {
                    var row = worksheet.Row(r);
                    for (int c = 1; c <= 15; c++)
                    {
                        var cellVal = row.Cell(c).GetString().Trim().ToUpperInvariant();
                        if (cellVal.Contains("IDDIST") || cellVal.Contains("UBIGEO"))
                        {
                            headerRowNumber = r;
                            colIdDist = c;
                            break;
                        }
                    }

                    if (headerRowNumber == r && colIdDist > 0)
                    {
                        // Mapear el resto de columnas según encabezados
                        for (int c = 1; c <= 15; c++)
                        {
                            var header = row.Cell(c).GetString().Trim().ToUpperInvariant();
                            if (header.Contains("NOMBDEP") || (header.Contains("DEP") && !header.Contains("PROV") && !header.Contains("DIST")))
                                colNombDep = c;
                            else if (header.Contains("NOMBPROV") || header.Contains("PROV"))
                                colNombProv = c;
                            else if (header.Contains("NOMBDIST") || header.Contains("DIST"))
                                colNombDist = c;
                            else if (header.Contains("CAPITAL"))
                                colNomCapital = c;
                            else if (header.Contains("COD_") || header.Contains("COD_ REG_NAT") || header.Contains("COD_REG_NAT"))
                                colCodRegNat = c;
                            else if (header.Contains("REGION NATURAL") || header.Contains("REG_NAT") || header.Contains("NATURAL"))
                                colRegionNat = c;
                        }
                        break;
                    }
                }

                int lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 0;
                var codigosVistos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                for (int r = headerRowNumber + 1; r <= lastRow; r++)
                {
                    var row = worksheet.Row(r);
                    var idDistRaw = row.Cell(colIdDist).GetString().Trim();

                    if (string.IsNullOrWhiteSpace(idDistRaw))
                    {
                        // Si la celda es numérica
                        var numVal = row.Cell(colIdDist).GetValue<string>();
                        if (!string.IsNullOrWhiteSpace(numVal))
                        {
                            idDistRaw = numVal.Trim();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(idDistRaw))
                    {
                        continue;
                    }

                    // Asegurar formato estándar de 6 dígitos del INEI (ej: "10101" -> "010101")
                    string codigo = idDistRaw.Length < 6 && int.TryParse(idDistRaw, out _)
                        ? idDistRaw.PadLeft(6, '0')
                        : idDistRaw;

                    if (codigosVistos.Contains(codigo))
                    {
                        continue;
                    }
                    codigosVistos.Add(codigo);

                    string nombDep = row.Cell(colNombDep).GetString().Trim();
                    string nombProv = row.Cell(colNombProv).GetString().Trim();
                    string nombDist = row.Cell(colNombDist).GetString().Trim();
                    string? nomCapital = row.Cell(colNomCapital).GetString()?.Trim();
                    string? codRegNat = row.Cell(colCodRegNat).GetString()?.Trim();
                    string? regionNat = row.Cell(colRegionNat).GetString()?.Trim();

                    if (string.IsNullOrWhiteSpace(nombDist))
                    {
                        nombDist = nomCapital ?? nombProv;
                    }

                    var ubigeo = Ubigeo.Crear(
                        codigo: codigo,
                        departamento: nombDep,
                        provincia: nombProv,
                        distrito: nombDist,
                        capitalLegal: string.IsNullOrWhiteSpace(nomCapital) ? null : nomCapital,
                        codigoRegionNatural: string.IsNullOrWhiteSpace(codRegNat) ? null : codRegNat,
                        regionNatural: string.IsNullOrWhiteSpace(regionNat) ? null : regionNat
                    );

                    ubigeos.Add(ubigeo);
                }
            }

            if (ubigeos.Count > 0)
            {
                logger.LogInformation("[UbigeoSeeder] Se leyeron {Count} ubigeos desde el Excel. Guardando en base de datos...", ubigeos.Count);
                await context.Ubigeos.AddRangeAsync(ubigeos);
                await context.SaveChangesAsync();
                logger.LogInformation("[UbigeoSeeder] ¡Carga de Ubigeos completada exitosamente! Total registros: {Count}", ubigeos.Count);
            }
            else
            {
                logger.LogWarning("[UbigeoSeeder] No se pudieron extraer registros válidos del archivo Excel.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[UbigeoSeeder] Ocurrió un error al sembrar los Ubigeos desde Excel.");
        }
    }
}
