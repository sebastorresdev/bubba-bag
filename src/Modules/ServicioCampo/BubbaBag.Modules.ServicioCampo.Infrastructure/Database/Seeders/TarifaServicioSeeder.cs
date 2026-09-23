using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class TarifaServicioSeeder
{
    public static async Task SeedAsync(ServicioCampoDbContext context, ILogger logger)
    {
        try
        {
            // 1. Asegurar la existencia del Cliente Corporativo DIRECTV en crm.clientes
            var directvCliente = await AsegurarClienteDirectvAsync(context, logger);

            // 2. Verificar si se requiere sembrar o sanear datos
            bool requiereSaneamiento = false;
            var cantidadActual = await context.TarifasServicio.CountAsync();
            var cantidadTiposTarea = await context.TiposTareaServicio.CountAsync();
            if (cantidadActual == 0 || cantidadTiposTarea == 0)
            {
                requiereSaneamiento = true;
            }
            else
            {
                // Detectar si faltan tareas clave como IB01, si hay desfase de columnas, o si la empresa sigue siendo 'DIRECTV' en vez de 'DIRECTV PERU S.R.L.'
                bool tieneDatosCorruptos = await context.TarifasServicio.AnyAsync(t =>
                    t.CodigoServicio.StartsWith("SERVICIOS") ||
                    t.Tipificacion == "GENERAL" ||
                    t.TipoTareaServicioId == null);
                bool faltaIB01 = !await context.TiposTareaServicio.AnyAsync(t => t.CodigoTarea == "IB01");
                bool tieneEmpresaGenerica = await context.TarifasServicio.AnyAsync(t => t.EmpresaContratante == "DIRECTV");

                if (tieneDatosCorruptos || faltaIB01 || tieneEmpresaGenerica)
                {
                    logger.LogWarning("[TarifaServicioSeeder] Se detectó falta de IB01 o empresa contratante 'DIRECTV'. Procediendo a saneamiento y recarga...");
                    requiereSaneamiento = true;
                }
            }

            if (!requiereSaneamiento)
            {
                logger.LogInformation("[TarifaServicioSeeder] Las tarifas de servicio y tipos de tarea ya se encuentran sembrados y consistentes ({Count} registros).", cantidadActual);
                return;
            }

            // 3. Localizar archivo Excel
            var candidatePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "Tarifario.xlsx"),
                Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "Tarifarios.xlsx"),
                @"C:\DEV_HOME\PROYECTOS\BUBBA_BAG\src\Host\BubbaBag.Api\Data\Seed\Tarifario.xlsx",
                @"C:\DEV_HOME\PROYECTOS\BUBBA_BAG\src\Host\BubbaBag.Api\Data\Seed\Tarifarios.xlsx",
                Path.Combine(Directory.GetCurrentDirectory(), "src", "Host", "BubbaBag.Api", "Data", "Seed", "Tarifario.xlsx"),
                Path.Combine(Directory.GetCurrentDirectory(), "Data", "Seed", "Tarifario.xlsx"),
            };

            string? excelPath = candidatePaths.FirstOrDefault(File.Exists);

            if (!string.IsNullOrEmpty(excelPath))
            {
                logger.LogInformation("[TarifaServicioSeeder] Importando tipos de tarea y tarifas desde archivo Excel: {Path}", excelPath);
                await ImportarDesdeExcelAsync(context, excelPath, directvCliente, logger);
                return;
            }

            // 4. Fallback si no se encuentra el archivo Excel físico
            logger.LogInformation("[TarifaServicioSeeder] Sembrando catálogo inicial oficial de tarifas DIRECTV de contingencia...");
            await SembrarDefaultContingenciaAsync(context, directvCliente, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[TarifaServicioSeeder] Error al sembrar las tarifas y tipos de tarea de servicio.");
        }
    }

    private static async Task<Cliente> AsegurarClienteDirectvAsync(ServicioCampoDbContext context, ILogger logger)
    {
        var directv = await context.Clientes.FirstOrDefaultAsync(c =>
            c.CodigoCliente == "CLI-DIRECTV" ||
            (c.RazonSocial != null && c.RazonSocial.ToUpper().Contains("DIRECTV")) ||
            c.Nombres.ToUpper().Contains("DIRECTV"));

        if (directv == null)
        {
            logger.LogInformation("[TarifaServicioSeeder] Registrando cliente corporativo DIRECTV PERU S.R.L. en CRM...");
            directv = Cliente.Crear(
                codigoCliente: "CLI-DIRECTV",
                documentoIdentidad: "20508565434",
                nombres: "DIRECTV",
                apellidos: null,
                telefonoPrincipal: "012004600",
                direccion: "Av. Javier Prado Este 444, San Isidro, Lima",
                ubigeoCodigo: "150131",
                esClienteFacturacion: true,
                esClienteServicio: false,
                tipoDocumento: "RUC",
                tipoPersona: "JURIDICA",
                razonSocial: "DIRECTV PERU S.R.L."
            );

            context.Clientes.Add(directv);
            await context.SaveChangesAsync();
        }

        return directv;
    }

    private static async Task ImportarDesdeExcelAsync(
        ServicioCampoDbContext context,
        string filePath,
        Cliente directvCliente,
        ILogger logger)
    {
        using var workbook = new XLWorkbook(filePath);
        var worksheet = workbook.Worksheets.FirstOrDefault();
        if (worksheet == null) return;

        int lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        int dataStartRow = 2; // Fila 1 es cabecera, datos oficiales inician en fila 2 (L33, IB01, etc.)

        // Cargar mapa existente de tipos de tarea de DIRECTV en memoria
        var tareasExistentes = await context.TiposTareaServicio
            .Where(t => t.ClienteFacturacionId == directvCliente.Id || t.ClienteFacturacionId == null)
            .ToDictionaryAsync(t => t.CodigoTarea, t => t);

        var nuevasTareas = new List<TipoTareaServicio>();
        var filasExcel = new List<FilaExcelTarifario>();

        decimal ParseMoneda(IXLCell cell)
        {
            var str = cell.GetString().Replace("S/", "").Replace("S/.", "").Replace("$", "").Trim();
            if (decimal.TryParse(str, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var v))
                return v;
            if (decimal.TryParse(str, System.Globalization.NumberStyles.Any, new System.Globalization.CultureInfo("es-PE"), out var vPe))
                return vPe;
            return cell.TryGetValue<decimal>(out var num) ? num : 0m;
        }

        for (int r = dataStartRow; r <= lastRow; r++)
        {
            var row = worksheet.Row(r);

            var tipificacion = row.Cell(1).GetString().Trim();       // Col A: TIPIFICACION
            var codigo = row.Cell(2).GetString().Trim();             // Col B: CODIGO
            var detalle = row.Cell(3).GetString().Trim();            // Col C: DETALLE DEL SERVICIO

            if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(detalle))
                continue;

            int puntos = int.TryParse(row.Cell(4).GetString().Trim(), out var p) ? p : (row.Cell(4).TryGetValue<int>(out var numP) ? numP : 0); // Col D: PUNTOS
            decimal fijoBase = ParseMoneda(row.Cell(5));             // Col E: FIJO Base
            decimal fijoAdic = ParseMoneda(row.Cell(6));             // Col F: FIJO Base Adicional (*)
            decimal varTotal = ParseMoneda(row.Cell(7));             // Col G: VARIABLE Variable
            decimal cycle = ParseMoneda(row.Cell(8));                // Col H: VARIABLE Cycle Time
            decimal agenda = ParseMoneda(row.Cell(9));               // Col I: VARIABLE Cumplimiento Agenda
            decimal sin30 = ParseMoneda(row.Cell(10));               // Col J: VARIABLE SIN 30
            decimal varAdicTotal = ParseMoneda(row.Cell(11));        // Col K: VARIABLE Variable Adicional (*)
            decimal cycleAdic = ParseMoneda(row.Cell(12));           // Col L: VARIABLE Cycle Time Adicional (*)
            decimal agendaAdic = ParseMoneda(row.Cell(13));          // Col M: VARIABLE Cumplimiento Agenda Adicional (*)
            decimal sin30Adic = ParseMoneda(row.Cell(14));           // Col N: VARIABLE SIN 30 Adicional (*)
            decimal total = ParseMoneda(row.Cell(15));               // Col O: TOTAL

            string aplicaPagoStr = row.Cell(16).GetString().Trim().ToUpperInvariant();   // Col P: APLICA PAGO
            bool aplicaPago = aplicaPagoStr == "SI" || aplicaPagoStr == "SÍ" || aplicaPagoStr == "TRUE" || aplicaPagoStr == "1";

            string aplicaGarantiaStr = row.Cell(17).GetString().Trim().ToUpperInvariant(); // Col Q: APLICA GARANTIA
            bool aplicaGarantia = aplicaGarantiaStr == "SI" || aplicaGarantiaStr == "SÍ" || aplicaGarantiaStr == "TRUE";

            filasExcel.Add(new FilaExcelTarifario(
                tipificacion,
                codigo,
                detalle,
                puntos,
                fijoBase,
                fijoAdic,
                varTotal,
                cycle,
                agenda,
                sin30,
                varAdicTotal,
                cycleAdic,
                agendaAdic,
                sin30Adic,
                total,
                aplicaPago,
                aplicaGarantia));

            var codigoUpper = codigo.ToUpperInvariant();
            if (!tareasExistentes.ContainsKey(codigoUpper))
            {
                var nuevaTarea = TipoTareaServicio.Crear(
                    codigoTarea: codigoUpper,
                    nombre: detalle,
                    clienteFacturacionId: directvCliente.Id,
                    duracionMinutos: puntos > 0 ? puntos * 30 : 60
                );
                tareasExistentes[codigoUpper] = nuevaTarea;
                nuevasTareas.Add(nuevaTarea);
            }
        }

        // 1. Guardar los tipos de tarea faltantes en TiposTareaServicio
        if (nuevasTareas.Count > 0)
        {
            await context.TiposTareaServicio.AddRangeAsync(nuevasTareas);
            await context.SaveChangesAsync();
            logger.LogInformation("[TarifaServicioSeeder] Se insertaron {Count} nuevos tipos de tarea de servicio correspondientes a DIRECTV.", nuevasTareas.Count);
        }

        // 2. Limpiar registros anteriores generales de TarifasServicio (preservando tarifas con sucursal específica creadas por el usuario)
        var tarifasGenerales = await context.TarifasServicio
            .Where(t => t.Sucursal == null || t.Sucursal == "" || t.Sucursal == "General" || t.Sucursal == "GENERAL")
            .ToListAsync();
        context.TarifasServicio.RemoveRange(tarifasGenerales);
        await context.SaveChangesAsync();

        var nombreEmpresaOficial = !string.IsNullOrWhiteSpace(directvCliente.RazonSocial)
            ? directvCliente.RazonSocial
            : (!string.IsNullOrWhiteSpace(directvCliente.Nombres) ? directvCliente.Nombres : "DIRECTV PERU S.R.L.");

        // 3. Crear registros de TarifasServicio con la relación directa a TipoTareaServicio y Cliente DIRECTV
        var tarifasFinales = new List<TarifaServicio>();
        foreach (var f in filasExcel)
        {
            var codigoUpper = f.Codigo.ToUpperInvariant();
            tareasExistentes.TryGetValue(codigoUpper, out var tareaRelacionada);

            tarifasFinales.Add(TarifaServicio.Crear(
                codigoServicio: f.Codigo,
                detalleServicio: f.Detalle,
                tipificacion: f.Tipificacion,
                tipoTareaServicioId: tareaRelacionada?.Id,
                empresaContratante: nombreEmpresaOficial,
                clienteFacturacionId: directvCliente.Id,
                sucursal: null,
                puntos: f.Puntos,
                fijoBase: f.FijoBase,
                fijoAdicional: f.FijoAdic,
                variableTotal: f.VarTotal,
                cycleTime: f.Cycle,
                agenda: f.Agenda,
                sin30: f.Sin30,
                variableAdicionalTotal: f.VarAdicTotal,
                cycleTimeAdic: f.CycleAdic,
                agendaAdic: f.AgendaAdic,
                sin30Adic: f.Sin30Adic,
                montoTotal: f.Total > 0 ? f.Total : null,
                aplicaPago: f.AplicaPago,
                aplicaGarantia: f.AplicaGarantia
            ));
        }

        await context.TarifasServicio.AddRangeAsync(tarifasFinales);
        await context.SaveChangesAsync();
        logger.LogInformation("[TarifaServicioSeeder] Se importaron y relacionaron {Count} tarifas oficiales DIRECTV exitosamente.", tarifasFinales.Count);
    }

    private static async Task SembrarDefaultContingenciaAsync(
        ServicioCampoDbContext context,
        Cliente directvCliente,
        ILogger logger)
    {
        context.TarifasServicio.RemoveRange(context.TarifasServicio);
        await context.SaveChangesAsync();

        var listaDefault = new List<(string Tipif, string Cod, string Nom, int Pts, decimal Base, decimal Total)>
        {
            ("SERVICIOS TECNICOS", "L33", "L33 – Servicio Preventivo", 2, 40m, 40m),
            ("INSTALACION", "IB01", "Instalación Básica Casa", 4, 80m, 115m),
            ("INSTALACION", "IB02", "Instalación Básica Edificio", 3, 59m, 59m),
            ("INSTALACION", "IB04", "Instalacion Basica Demo", 4, 80m, 115m),
            ("INSTALACION", "IA01", "Instalación Adicional Casa", 1, 21m, 30m),
            ("INSTALACION", "IA02", "Instalación adicional Edificio", 3, 59m, 59m),
            ("INSTALACION", "IA04", "Instalacion Adicional Demo", 1, 21m, 30m),
            ("INSTALACION", "IA05", "Instalación Adicional Casa, segunda visita", 1, 28m, 55m),
            ("INSTALACION", "IA06", "Instalación Adicional Edificio, seg. visita", 3, 59m, 59m),
            ("SERVICIOS DE INSTALACION", "IC01", "Cambio IRD a DVR", 1, 28m, 55m),
            ("SERVICIOS DE INSTALACION", "IC02", "Cambio IRD a HD", 1, 28m, 55m),
            ("SERVICIOS DE INSTALACION", "IC03", "Cambio DVR a HD", 1, 28m, 55m),
            ("SERVICIOS DE INSTALACION", "IC10", "Cambio HD Only - IRD", 1, 28m, 55m),
            ("MUDANZA", "MB01", "Mudanza Básica Casa", 4, 80m, 115m),
            ("AUDITORIAS", "AU01", "Auditoría de Calidad Técnica", 2, 45m, 45m)
        };

        var tarifas = new List<TarifaServicio>();
        foreach (var item in listaDefault)
        {
            var tarea = await context.TiposTareaServicio.FirstOrDefaultAsync(t => t.CodigoTarea == item.Cod);
            if (tarea == null)
            {
                tarea = TipoTareaServicio.Crear(item.Cod, item.Nom, directvCliente.Id, item.Pts * 30);
                context.TiposTareaServicio.Add(tarea);
                await context.SaveChangesAsync();
            }

            tarifas.Add(TarifaServicio.Crear(
                codigoServicio: item.Cod,
                detalleServicio: item.Nom,
                tipificacion: item.Tipif,
                tipoTareaServicioId: tarea.Id,
                empresaContratante: "DIRECTV",
                clienteFacturacionId: directvCliente.Id,
                puntos: item.Pts,
                fijoBase: item.Base,
                montoTotal: item.Total
            ));
        }

        await context.TarifasServicio.AddRangeAsync(tarifas);
        await context.SaveChangesAsync();
        logger.LogInformation("[TarifaServicioSeeder] Se sembraron {Count} tarifas de contingencia.", tarifas.Count);
    }

    private record FilaExcelTarifario(
        string Tipificacion,
        string Codigo,
        string Detalle,
        int Puntos,
        decimal FijoBase,
        decimal FijoAdic,
        decimal VarTotal,
        decimal Cycle,
        decimal Agenda,
        decimal Sin30,
        decimal VarAdicTotal,
        decimal CycleAdic,
        decimal AgendaAdic,
        decimal Sin30Adic,
        decimal Total,
        bool AplicaPago,
        bool AplicaGarantia
    );
}
