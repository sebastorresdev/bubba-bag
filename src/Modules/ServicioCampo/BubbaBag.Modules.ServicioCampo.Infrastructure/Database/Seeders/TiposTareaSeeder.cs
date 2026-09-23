using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class TiposTareaSeeder
{
    public static async Task SeedAsync(ServicioCampoDbContext context, ILogger logger)
    {
        try
        {
            // 1. Asegurar la existencia del Cliente Corporativo DIRECTV en crm.clientes
            var directvCliente = await AsegurarClienteDirectvAsync(context, logger);

            // 2. Verificar si ya existen los tipos de tarea
            var cantidadTiposTarea = await context.TiposTareaServicio.CountAsync();
            bool faltaIB01 = !await context.TiposTareaServicio.AnyAsync(t => t.CodigoTarea == "IB01");

            if (cantidadTiposTarea > 0 && !faltaIB01)
            {
                logger.LogInformation("[TiposTareaSeeder] Los tipos de tarea de servicio ya se encuentran sembrados ({Count} registros).", cantidadTiposTarea);
                return;
            }

            // 3. Localizar archivo Excel si existe
            var candidatePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "Tarifario.xlsx"),
                Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "Tarifarios.xlsx"),
                @"C:\DEV_HOME\PROYECTOS\BUBBA_BAG\src\Host\BubbaBag.Api\Data\Seed\Tarifario.xlsx",
                @"C:\DEV_HOME\PROYECTOS\BUBBA_BAG\src\Host\BubbaBag.Api\Data\Seed\Tarifarios.xlsx",
            };

            string? excelPath = candidatePaths.FirstOrDefault(File.Exists);

            if (excelPath != null)
            {
                logger.LogInformation("[TiposTareaSeeder] Importando tipos de tarea desde archivo Excel: {Path}", excelPath);
                await ImportarDesdeExcelAsync(context, excelPath, directvCliente, logger);
            }
            else
            {
                logger.LogInformation("[TiposTareaSeeder] Sembrando catálogo inicial de tipos de tarea de contingencia...");
                await SembrarDefaultContingenciaAsync(context, directvCliente, logger);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[TiposTareaSeeder] Error al sembrar los tipos de tarea de servicio.");
        }
    }

    private static async Task<Cliente> AsegurarClienteDirectvAsync(ServicioCampoDbContext context, ILogger logger)
    {
        var directv = await context.Clientes
            .FirstOrDefaultAsync(c => c.CodigoCliente == "CLI-DIRECTV" ||
                                      c.DocumentoIdentidad == "20508565434" ||
                                      (c.RazonSocial != null && c.RazonSocial.Contains("DIRECTV")));

        if (directv == null)
        {
            logger.LogInformation("[TiposTareaSeeder] Registrando cliente corporativo DIRECTV PERU S.R.L....");
            var ubigeoSurco = await context.Ubigeos.FirstOrDefaultAsync(u => u.Codigo == "150140");
            var ubigeoCodigo = ubigeoSurco?.Codigo ?? "150101";

            directv = Cliente.Crear(
                codigoCliente: "CLI-DIRECTV",
                documentoIdentidad: "20508565434",
                nombres: "DIRECTV",
                apellidos: null,
                telefonoPrincipal: "012004600",
                direccion: "AV. MANUEL OLGUIN NRO. 325 INT. 1601 URB. EL DERBY, SANTIAGO DE SURCO",
                ubigeoCodigo: ubigeoCodigo,
                esClienteFacturacion: true,
                esClienteServicio: false,
                tipoDocumento: "RUC",
                tipoPersona: "JURIDICA",
                razonSocial: "DIRECTV PERU S.R.L.",
                email: "atencion@directv.pe",
                referencia: "Edificio Capital El Derby"
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
        int dataStartRow = 2;

        var tareasExistentes = await context.TiposTareaServicio
            .Where(t => t.ClienteFacturacionId == directvCliente.Id || t.ClienteFacturacionId == null)
            .ToDictionaryAsync(t => t.CodigoTarea, t => t);

        var nuevasTareas = new List<TipoTareaServicio>();

        for (int r = dataStartRow; r <= lastRow; r++)
        {
            var row = worksheet.Row(r);
            var codigo = row.Cell(2).GetString().Trim();
            var detalle = row.Cell(3).GetString().Trim();

            if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(detalle))
                continue;

            var codigoUpper = codigo.ToUpperInvariant();
            if (!tareasExistentes.ContainsKey(codigoUpper) && !nuevasTareas.Any(t => t.CodigoTarea == codigoUpper))
            {
                var duracionMin = 60;
                var nuevaTarea = TipoTareaServicio.Crear(
                    codigoTarea: codigoUpper,
                    nombre: detalle,
                    clienteFacturacionId: directvCliente.Id,
                    duracionMinutos: duracionMin
                );
                nuevasTareas.Add(nuevaTarea);
            }
        }

        if (nuevasTareas.Count > 0)
        {
            await context.TiposTareaServicio.AddRangeAsync(nuevasTareas);
            await context.SaveChangesAsync();
            logger.LogInformation("[TiposTareaSeeder] Se insertaron {Count} nuevos tipos de tarea correspondientes a DIRECTV.", nuevasTareas.Count);
        }
    }

    private static async Task SembrarDefaultContingenciaAsync(
        ServicioCampoDbContext context,
        Cliente directvCliente,
        ILogger logger)
    {
        var listaDefault = new List<(string Cod, string Nom)>
        {
            ("L33", "L33 – Servicio Preventivo"),
            ("IB01", "Instalación Básica Casa"),
            ("IB02", "Instalación Básica Edificio"),
            ("IB04", "Instalación Básica Demo"),
            ("IA01", "Instalación Adicional Casa"),
            ("MB01", "Mudanza Básica"),
            ("S06", "Avería Decodificador"),
            ("S10", "Avería Antena"),
            ("REC01", "Recojo / Retiro de Equipos")
        };

        var tareasExistentes = await context.TiposTareaServicio
            .Select(t => t.CodigoTarea)
            .ToListAsync();

        var nuevas = new List<TipoTareaServicio>();
        foreach (var def in listaDefault)
        {
            if (!tareasExistentes.Contains(def.Cod))
            {
                nuevas.Add(TipoTareaServicio.Crear(
                    codigoTarea: def.Cod,
                    nombre: def.Nom,
                    clienteFacturacionId: directvCliente.Id,
                    duracionMinutos: 60
                ));
            }
        }

        if (nuevas.Count > 0)
        {
            await context.TiposTareaServicio.AddRangeAsync(nuevas);
            await context.SaveChangesAsync();
            logger.LogInformation("[TiposTareaSeeder] Se sembraron {Count} tipos de tarea de contingencia.", nuevas.Count);
        }
    }
}
