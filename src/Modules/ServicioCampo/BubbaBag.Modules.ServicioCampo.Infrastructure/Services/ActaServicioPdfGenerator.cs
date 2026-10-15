using System;
using System.IO;
using System.Linq;
using BubbaBag.Modules.ServicioCampo.Domain.Configuracion;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

/// <summary>
/// Generador de Acta / Informe de Servicio Técnico para firma en campo (1 Sola Página A4).
/// Formato oficial inspirado en el estándar de contratistas e informes de servicio de telecomunicaciones (DIRECTV / Agente Autorizado).
/// Incluye cláusula de protección de datos personales (Ley 29733).
/// </summary>
public static class ActaServicioPdfGenerator
{
    static ActaServicioPdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.UseSystemFonts = true;
        QuestPDF.Settings.ThrowOnMissingFontFamilies = false;
    }

    public static byte[] GenerarActa(OrdenTrabajo orden, ConfiguracionEmpresa? empresa)
    {
        var ultimaVisita = orden.Visitas
            .OrderByDescending(v => v.NumeroVisita)
            .FirstOrDefault();

        string nombreEmpresa = empresa?.NombreComercial 
            ?? empresa?.RazonSocial 
            ?? orden.ClienteFacturacion?.NombreCompletoODenominacion 
            ?? "DIRECTV";
            
        string entidadLegal = empresa?.RazonSocial ?? nombreEmpresa;
        string? emailLegal = empresa?.Email ?? "datospersonales@directv.pe";

        byte[]? logoBytes = ExtraerBytesImagen(empresa?.LogoBase64);
        byte[]? firmaBytes = ExtraerBytesImagen(ultimaVisita?.FirmaClienteUrl);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                // Márgenes precisos para garantizar exactamente 1 página sin desbordes
                page.MarginTop(12, Unit.Point);
                page.MarginBottom(12, Unit.Point);
                page.MarginLeft(16, Unit.Point);
                page.MarginRight(16, Unit.Point);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(6.8f).FontFamily("Arial", "Helvetica", "sans-serif").FontColor(Colors.Black));

                page.Content().Column(col =>
                {
                    // =========================================================
                    // 1. ENCABEZADO PRINCIPAL (LOGO, TÍTULO, FECHA INFORME)
                    // =========================================================
                    col.Item().Row(r =>
                    {
                        // Columna Izquierda: Logo / Nombre Comercial
                        r.RelativeItem(3).Column(c =>
                        {
                            if (logoBytes != null && logoBytes.Length > 0)
                            {
                                c.Item().MaxHeight(28).MaxWidth(110).Image(logoBytes);
                            }
                            else
                            {
                                c.Item().Text(nombreEmpresa.ToUpper()).Bold().FontSize(13).FontColor(Colors.Blue.Darken4);
                            }
                            c.Item().Text("AGENTE AUTORIZADO").Bold().FontSize(8.5f).FontColor(Colors.Grey.Darken3);
                        });

                        // Columna Centro: Título Oficial
                        r.RelativeItem(5).AlignCenter().AlignMiddle().Column(c =>
                        {
                            c.Item().AlignCenter().Text("INFORME DE SERVICIO").Bold().FontSize(12.5f).FontColor(Colors.Black);
                        });

                        // Columna Derecha: Metadata de Emisión
                        r.RelativeItem(3).AlignRight().Column(c =>
                        {
                            c.Item().AlignRight().Text($"Fecha Informe: {DateTime.Now:dd-MMM-yyyy HH:mm:ss}").FontSize(6.5f);
                            c.Item().AlignRight().Text("Página 1 de 1").FontSize(6.5f);
                            c.Item().AlignRight().Text("Copia para el Cliente y Operaciones").FontSize(6f).Italic().FontColor(Colors.Grey.Darken1);
                        });
                    });

                    // =========================================================
                    // 2. INFORMACIÓN DEL SUSCRIPTOR / CLIENTE (BLOQUES CON BORDE NEGRO Y CABECERAS CELESTES)
                    // =========================================================
                    col.Item().PaddingTop(4).AlignCenter().Text("Información del Suscriptor").Bold().FontSize(8.5f);

                    string numCliente = orden.ClienteServicio?.CodigoCliente ?? "51792920";
                    string numWo = !string.IsNullOrWhiteSpace(orden.NumeroOrden) 
                        ? orden.NumeroOrden 
                        : (!string.IsNullOrWhiteSpace(orden.ReferenciaExterna) ? orden.ReferenciaExterna : orden.CodigoWo);

                    col.Item().PaddingTop(1).Border(0.5f).BorderColor(Colors.Black).Column(c =>
                    {
                        // Fila 1: N° Cliente y N° WO con Código de Barras
                        c.Item().Row(r =>
                        {
                            // N° de Cliente
                            r.RelativeItem(5).BorderRight(0.5f).BorderColor(Colors.Black).Row(rsub =>
                            {
                                rsub.ConstantItem(75).Background(Color.FromHex("#DCE6F1")).Padding(2).AlignMiddle().AlignCenter()
                                    .Text("N° de Cliente").Bold().FontSize(7.5f);
                                rsub.RelativeItem().PaddingVertical(2).AlignCenter().Column(bcol =>
                                {
                                    RenderBarcodeVisual(bcol, numCliente, 12f);
                                    bcol.Item().AlignCenter().Text(numCliente).Bold().FontSize(7f);
                                });
                            });

                            // N° WO
                            r.RelativeItem(5).Row(rsub =>
                            {
                                rsub.ConstantItem(75).Background(Color.FromHex("#DCE6F1")).Padding(2).AlignMiddle().AlignCenter()
                                    .Text("N° WO").Bold().FontSize(7.5f);
                                rsub.RelativeItem().PaddingVertical(2).AlignCenter().Column(bcol =>
                                {
                                    RenderBarcodeVisual(bcol, numWo, 12f);
                                    bcol.Item().AlignCenter().Text(numWo).Bold().FontSize(7f);
                                });
                            });
                        });

                        // Fila 2: Nombre, Tipo de Cliente, Provincia
                        c.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(r =>
                        {
                            r.RelativeItem(4.5f).BorderRight(0.5f).BorderColor(Colors.Black).Row(rx =>
                            {
                                rx.ConstantItem(75).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Nombre y Apellidos").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ClienteServicio?.NombreCompletoODenominacion ?? "Cliente Particular").Bold().FontSize(6.8f);
                            });
                            r.RelativeItem(2.5f).BorderRight(0.5f).BorderColor(Colors.Black).Row(rx =>
                            {
                                rx.ConstantItem(55).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Tipo Cliente:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.TipoOrden?.Nombre ?? "Normal Casa").FontSize(6.8f);
                            });
                            r.RelativeItem(3.0f).Row(rx =>
                            {
                                rx.ConstantItem(55).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Provincia:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ClienteServicio?.Ubigeo?.Provincia ?? "LIMA").FontSize(6.8f);
                            });
                        });

                        // Fila 3: Dirección / Calle, Localidad, Código Postal
                        c.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(r =>
                        {
                            r.RelativeItem(4.5f).BorderRight(0.5f).BorderColor(Colors.Black).Row(rx =>
                            {
                                rx.ConstantItem(75).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Dirección / Calle:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ClienteServicio?.Direccion ?? "Sin dirección registrada").FontSize(6.8f);
                            });
                            r.RelativeItem(2.5f).BorderRight(0.5f).BorderColor(Colors.Black).Row(rx =>
                            {
                                rx.ConstantItem(55).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Localidad:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ClienteServicio?.Ubigeo?.Distrito ?? "LIMA").FontSize(6.8f);
                            });
                            r.RelativeItem(3.0f).Row(rx =>
                            {
                                rx.ConstantItem(55).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Código Postal:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ClienteServicio?.UbigeoCodigo ?? "150101").FontSize(6.8f);
                            });
                        });

                        // Fila 4: Referencias, Partido/Dpto, Barrio/Zona
                        c.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(r =>
                        {
                            r.RelativeItem(4.5f).BorderRight(0.5f).BorderColor(Colors.Black).Row(rx =>
                            {
                                rx.ConstantItem(75).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Referencias:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ClienteServicio?.ReferenciaUbicacion ?? "—").FontSize(6.8f);
                            });
                            r.RelativeItem(2.5f).BorderRight(0.5f).BorderColor(Colors.Black).Row(rx =>
                            {
                                rx.ConstantItem(55).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Partido:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ClienteServicio?.Ubigeo?.Departamento ?? "LIMA").FontSize(6.8f);
                            });
                            r.RelativeItem(3.0f).Row(rx =>
                            {
                                rx.ConstantItem(55).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Barrio / Zona:").Bold().FontSize(6.8f);
                                rx.RelativeItem().Padding(2).Text(orden.ZonaOperativa?.Nombre ?? "Lima Metropolitana").FontSize(6.8f);
                            });
                        });

                        // Fila 5: Datos Adicionales (Teléfonos)
                        c.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(r =>
                        {
                            r.ConstantItem(75).Background(Color.FromHex("#DCE6F1")).Padding(2).Text("Datos Adicionales:").Bold().FontSize(6.8f);
                            var tel = orden.ClienteServicio?.TelefonoPrincipal ?? "—";
                            var telSec = !string.IsNullOrWhiteSpace(orden.ClienteServicio?.TelefonoSecundario) ? $" / {orden.ClienteServicio.TelefonoSecundario}" : "";
                            r.RelativeItem().Padding(2).Text($"Teléfonos de Contacto: {tel}{telSec} | Doc Identidad: {orden.ClienteServicio?.DocumentoIdentidad ?? "—"}").FontSize(6.8f);
                        });
                    });

                    // =========================================================
                    // 3. DATOS DE LA COMPAÑÍA INSTALADORA / TÉCNICO
                    // =========================================================
                    col.Item().PaddingTop(3).Border(0.5f).BorderColor(Colors.Black).Column(c =>
                    {
                        c.Item().Background(Color.FromHex("#F2F4F8")).Padding(2).AlignCenter()
                            .Text("Datos de la compañía instaladora").Bold().FontSize(7.5f);

                        var tecNombre = ultimaVisita?.Recurso?.NombreCompleto ?? "Técnico Asignado de Cuadrilla";
                        var tecDni = ultimaVisita?.Recurso?.DocumentoIdentidad ?? "—";
                        var cuadrilla = orden.ZonaOperativa?.Nombre ?? "Cuadrilla Técnica Oficial";
                        var tecCodigo = ultimaVisita?.Recurso?.Codigo ?? "I280000";

                        c.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(r =>
                        {
                            r.RelativeItem(5).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Text($"Técnico 1: {tecNombre}").Bold().FontSize(6.8f);
                            r.RelativeItem(2.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Text($"N° ID: {tecDni}").FontSize(6.8f);
                            r.RelativeItem(2.5f).Padding(2).Text($"Cuadrilla: {cuadrilla}").FontSize(6.8f);
                        });

                        c.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(r =>
                        {
                            r.RelativeItem(5).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Text("Técnico 2: —").FontSize(6.8f);
                            r.RelativeItem(2.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Text("N° ID: —").FontSize(6.8f);
                            r.RelativeItem(2.5f).Padding(2).Text($"Código de Instalador: {tecCodigo}").FontSize(6.8f);
                        });

                        // Fila Visita y Advertencia
                        c.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(r =>
                        {
                            // Datos de Visita
                            r.RelativeItem(6).BorderRight(0.5f).BorderColor(Colors.Black).Column(vcol =>
                            {
                                var codVisita = ultimaVisita?.CodigoVisita ?? $"{orden.CodigoWo}-V1";
                                vcol.Item().Padding(2).Text($"Visita N°: {codVisita}").Bold().FontSize(7f);
                                vcol.Item().BorderTop(0.5f).BorderColor(Colors.Black).Row(vr =>
                                {
                                    vr.RelativeItem().BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Column(x =>
                                    {
                                        x.Item().Text("Fecha Creación").Bold().FontSize(6.5f);
                                        x.Item().Text(orden.CreatedAt.ToString("dd/MM/yyyy")).FontSize(6.5f);
                                    });
                                    vr.RelativeItem().BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Column(x =>
                                    {
                                        x.Item().Text("Comentarios").Bold().FontSize(6.5f);
                                        x.Item().Text(ultimaVisita?.BloqueHorario ?? "Cita programada").FontSize(6.5f);
                                    });
                                    vr.RelativeItem().Padding(2).Column(x =>
                                    {
                                        x.Item().Text("Fecha Agendado").Bold().FontSize(6.5f);
                                        var fprog = ultimaVisita?.FechaProgramada.ToString("dd/MM/yyyy") ?? orden.FechaProgramada?.ToString("dd/MM/yyyy") ?? "—";
                                        x.Item().Text(fprog).FontSize(6.5f);
                                    });
                                });
                            });

                            // Box Advertencia Técnica
                            r.RelativeItem(4).Background(Color.FromHex("#FAFAFA")).Padding(3).AlignMiddle().Column(w =>
                            {
                                w.Item().Text("IMPORTANTE: Asegurar protocolos de calidad técnica y seguridad en sitio. Validar conectores homologados y verificar niveles de señal.").Bold().FontSize(6.3f).FontColor(Colors.Black);
                            });
                        });
                    });

                    // =========================================================
                    // 4. DATOS DE LAS TAREAS / TRABAJOS (CON CÓDIGO IBS / EXTERNO)
                    // =========================================================
                    col.Item().PaddingTop(3).Text("Datos de la Tareas:").Bold().FontSize(7.5f);
                    col.Item().PaddingTop(1).Border(0.5f).BorderColor(Colors.Black).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3); // Servicio
                            columns.RelativeColumn(3); // N° WO IBS
                            columns.RelativeColumn(4); // Device / Serial / Velocidad
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Color.FromHex("#DCE6F1")).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("Servicio").Bold().FontSize(6.8f);
                            header.Cell().Background(Color.FromHex("#DCE6F1")).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("N° WO IBS / Cód. Externo").Bold().FontSize(6.8f);
                            header.Cell().Background(Color.FromHex("#DCE6F1")).BorderBottom(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("Device / Serial / Referencia").Bold().FontSize(6.8f);
                        });

                        if (orden.Trabajos.Count > 0)
                        {
                            foreach (var tr in orden.Trabajos)
                            {
                                string codExt = !string.IsNullOrWhiteSpace(tr.CodigoExterno) ? tr.CodigoExterno : tr.CodigoTrabajo;
                                string refDispositivo = !string.IsNullOrWhiteSpace(tr.ReferenciaEquipo) ? tr.ReferenciaEquipo : (tr.Producto?.Nombre ?? "Equipo Estándar");

                                table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2)
                                    .Text(tr.Producto?.Nombre ?? tr.CodigoTrabajo).FontSize(6.6f);

                                table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).PaddingVertical(1).AlignCenter().Column(c =>
                                {
                                    RenderBarcodeVisual(c, codExt, 10f);
                                    c.Item().AlignCenter().Text(codExt).FontSize(6.5f);
                                });

                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Black).Padding(2)
                                    .Text(refDispositivo).FontSize(6.6f);
                            }
                        }
                        else
                        {
                            table.Cell().BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Text(orden.TipoOrden?.Nombre ?? "Servicio Técnico").FontSize(6.6f);
                            table.Cell().BorderRight(0.5f).BorderColor(Colors.Black).PaddingVertical(1).AlignCenter().Column(c =>
                            {
                                RenderBarcodeVisual(c, numWo, 10f);
                                c.Item().AlignCenter().Text(numWo).FontSize(6.5f);
                            });
                            table.Cell().Padding(2).Text("Equipos de conexión y recepción de señal").FontSize(6.6f);
                        }
                    });

                    // =========================================================
                    // 5. OBSERVACIONES GENERALES
                    // =========================================================
                    col.Item().PaddingTop(2).Row(r =>
                    {
                        var obs = orden.ObservacionesCierre ?? orden.ObservacionesGenerales ?? ultimaVisita?.ObservacionesTecnico ?? "Atención técnica culminada operativamente de acuerdo con las normas de instalación.";
                        r.RelativeItem().Text($"Observaciones generales: {obs}").FontSize(6.5f).FontColor(Colors.Grey.Darken3);
                    });

                    // =========================================================
                    // 6. INFORMACIÓN DE EQUIPOS SERIALIZADOS (INSTALADOS / RETIRADOS)
                    // =========================================================
                    col.Item().PaddingTop(3).Border(0.5f).BorderColor(Colors.Black).Column(c =>
                    {
                        c.Item().Background(Color.FromHex("#F2F4F8")).Padding(2).AlignCenter()
                            .Text("Información de decodificadores, tarjetas y equipos del suscriptor").Bold().FontSize(7.5f);

                        c.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2.5f); // Equipo / Smartcard
                                columns.RelativeColumn(3.5f); // N° Serie con Barcode
                                columns.RelativeColumn(1.8f); // Modelo
                                columns.RelativeColumn(1.8f); // Categoría Financiera
                                columns.ConstantColumn(16);   // R
                                columns.ConstantColumn(16);   // I
                                columns.RelativeColumn(2.5f); // Equipo/Smartcard Nuevo
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("Equipo / Smartcard").Bold().FontSize(6.5f);
                                header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("N° Serie").Bold().FontSize(6.5f);
                                header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("Modelo").Bold().FontSize(6.5f);
                                header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("Categoría\nFinanciera").Bold().FontSize(6f);
                                header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("R").Bold().FontSize(6.5f);
                                header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("I").Bold().FontSize(6.5f);
                                header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("Equipo/Smartcard\nNuevo").Bold().FontSize(6f);
                            });

                            // Obtener serializados de Liquidaciones o Trabajos
                            var listaSeriales = orden.LiquidacionesMaterial
                                .SelectMany(l => l.Items)
                                .Where(i => !string.IsNullOrWhiteSpace(i.NumeroSerie) && i.NumeroSerie != "—")
                                .ToList();

                            if (listaSeriales.Count > 0)
                            {
                                foreach (var item in listaSeriales.Take(4))
                                {
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Text(item.Producto?.Nombre ?? "Equipo").FontSize(6.5f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).PaddingVertical(1).AlignCenter().Column(bc =>
                                    {
                                        RenderBarcodeVisual(bc, item.NumeroSerie!, 10f);
                                        bc.Item().AlignCenter().Text(item.NumeroSerie!).FontSize(6.2f);
                                    });
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text(item.Producto?.Codigo ?? "HD-01").FontSize(6.5f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text(item.EsRetiro ? "R - Rent" : "M - Mirrored").FontSize(6f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text(item.EsRetiro ? "X" : "").Bold().FontSize(7f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text(!item.EsRetiro ? "X" : "").Bold().FontSize(7f);
                                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text(item.EsRetiro ? "Reemplazo" : "Operativo").FontSize(6.2f);
                                }
                            }
                            else
                            {
                                // Filas tipo formato para completar si no hay seriales pre-registrados
                                string[] dummyEquipos = { "SC (Smartcard)", "HD Only (Decodificador)", "LNB", "ANTENNA" };
                                foreach (var eq in dummyEquipos)
                                {
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).Text(eq).FontSize(6.5f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("—").FontSize(6.5f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("STD").FontSize(6.5f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("M - Mirrored").FontSize(6f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("").FontSize(6.5f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("X").Bold().FontSize(7f);
                                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Black).Padding(2).AlignCenter().Text("Instalado").FontSize(6.2f);
                                }
                            }
                        });
                    });

                    col.Item().PaddingTop(1).Text("Nota: Completar con una \"X\" la casilla que corresponda, R = Retirado ; I = Instalado").FontSize(5.8f).Italic();

                    // =========================================================
                    // 7. CURSO DE INVENTARIO NO SERIALIZADO (MATERIALES Y ELEMENTOS)
                    // =========================================================
                    col.Item().PaddingTop(2).Border(0.5f).BorderColor(Colors.Black).Column(c =>
                    {
                        c.Item().Background(Color.FromHex("#F2F4F8")).Padding(1.5f).AlignCenter()
                            .Text("Curso de inventario no Serializado").Bold().FontSize(7f);

                        c.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); columns.RelativeColumn(1);
                                columns.RelativeColumn(3); columns.RelativeColumn(1);
                                columns.RelativeColumn(3); columns.RelativeColumn(1);
                                columns.RelativeColumn(3); columns.RelativeColumn(1);
                                columns.RelativeColumn(3); columns.RelativeColumn(1);
                            });

                            table.Header(header =>
                            {
                                for (int i = 0; i < 5; i++)
                                {
                                    header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(1.5f).Text("Material").Bold().FontSize(5.8f);
                                    header.Cell().Background(Color.FromHex("#DCE6F1")).BorderTop(0.5f).BorderBottom(0.5f).BorderRight(i < 4 ? 0.5f : 0f).BorderColor(Colors.Black).Padding(1.5f).AlignCenter().Text("Cant.").Bold().FontSize(5.8f);
                                }
                            });

                            // Items no serializados
                            string[] items1 = { "Antena", "MSW 4 VÍAS", "SWIM 8", "Router FTTH", "Cable exterior" };
                            string[] items2 = { "LNB", "MSW 8 VÍAS", "I-Power Supply", "Patchcord FTTH", "Cable interior" };
                            string[] items3 = { "LNB SWIM", "Caja Estanco", "Amplificador", "Conector FTTH", "Conector RJ45" };
                            string[] items4 = { "Cable Coaxial", "Splitter", "Roseta", "Diplexer", "Patchcord Int." };

                            foreach (var rowItems in new[] { items1, items2, items3, items4 })
                            {
                                for (int k = 0; k < 5; k++)
                                {
                                    table.Cell().BorderBottom(0.5f).BorderRight(0.5f).BorderColor(Colors.Black).Padding(1.5f).Text(rowItems[k]).FontSize(5.7f);
                                    table.Cell().BorderBottom(0.5f).BorderRight(k < 4 ? 0.5f : 0f).BorderColor(Colors.Black).Padding(1.5f).AlignCenter().Text("—").FontSize(5.7f);
                                }
                            }
                        });
                    });

                    // =========================================================
                    // 8. OBSERVACIONES Y DECLARACIONES DE SATISFACCIÓN
                    // =========================================================
                    col.Item().PaddingTop(3).Border(0.5f).BorderColor(Colors.Black).Row(r =>
                    {
                        r.RelativeItem().BorderRight(0.5f).BorderColor(Colors.Black).Padding(3).Column(c =>
                        {
                            c.Item().Text("Observaciones del Cliente:").Bold().FontSize(6.8f);
                            c.Item().PaddingTop(1).Text("Declaro haber recibido a satisfacción los trabajos de instalación de los equipos que aquí se relacionan.")
                                .FontSize(6.4f).FontColor(Colors.Grey.Darken3);
                        });

                        r.RelativeItem().Padding(3).Column(c =>
                        {
                            c.Item().Text("Observaciones del Técnico:").Bold().FontSize(6.8f);
                            c.Item().PaddingTop(1).Text($"Declaro haber realizado un servicio profesional de acuerdo a las normas técnicas y políticas establecidas por {nombreEmpresa}.")
                                .FontSize(6.4f).FontColor(Colors.Grey.Darken3);
                        });
                    });

                    // =========================================================
                    // 9. RECUADROS DE FIRMAS Y DATOS DE FIRMANTES (LADO A LADO)
                    // =========================================================
                    col.Item().BorderLeft(0.5f).BorderRight(0.5f).BorderBottom(0.5f).BorderColor(Colors.Black).Row(r =>
                    {
                        // Firma Cliente
                        r.RelativeItem(2.2f).BorderRight(0.5f).BorderColor(Colors.Black).Height(38).Column(c =>
                        {
                            if (firmaBytes != null && firmaBytes.Length > 0)
                                c.Item().MaxHeight(26).MaxWidth(90).AlignCenter().Image(firmaBytes);
                            else
                                c.Item().Height(26);
                            c.Item().BorderTop(0.5f).BorderColor(Colors.Black).AlignCenter().Text("Firma Cliente").Bold().FontSize(6.2f);
                        });

                        // Aclaración Cliente
                        r.RelativeItem(2.2f).BorderRight(0.5f).BorderColor(Colors.Black).Height(38).Column(c =>
                        {
                            c.Item().Height(26).AlignBottom().Padding(2).Text(orden.ClienteServicio?.NombreCompletoODenominacion ?? "").FontSize(6.2f);
                            c.Item().BorderTop(0.5f).BorderColor(Colors.Black).AlignCenter().Text("Aclaración Cliente").Bold().FontSize(6.2f);
                        });

                        // DNI Cliente
                        r.RelativeItem(1.4f).BorderRight(0.5f).BorderColor(Colors.Black).Height(38).Column(c =>
                        {
                            c.Item().Height(26).AlignBottom().AlignCenter().Text(orden.ClienteServicio?.DocumentoIdentidad ?? "—").FontSize(6.2f);
                            c.Item().BorderTop(0.5f).BorderColor(Colors.Black).AlignCenter().Text("DNI Cliente").Bold().FontSize(6.2f);
                        });

                        // Firma Técnico
                        r.RelativeItem(2.2f).BorderRight(0.5f).BorderColor(Colors.Black).Height(38).Column(c =>
                        {
                            c.Item().Height(26);
                            c.Item().BorderTop(0.5f).BorderColor(Colors.Black).AlignCenter().Text("Firma Técnico").Bold().FontSize(6.2f);
                        });

                        // Aclaración Técnico
                        r.RelativeItem(2.2f).BorderRight(0.5f).BorderColor(Colors.Black).Height(38).Column(c =>
                        {
                            var tec = ultimaVisita?.Recurso?.NombreCompleto ?? "Técnico Oficial";
                            c.Item().Height(26).AlignBottom().Padding(2).Text(tec).FontSize(6.2f);
                            c.Item().BorderTop(0.5f).BorderColor(Colors.Black).AlignCenter().Text("Aclaración Técnico").Bold().FontSize(6.2f);
                        });

                        // DNI Técnico
                        r.RelativeItem(1.4f).Height(38).Column(c =>
                        {
                            var dniTec = ultimaVisita?.Recurso?.DocumentoIdentidad ?? "—";
                            c.Item().Height(26).AlignBottom().AlignCenter().Text(dniTec).FontSize(6.2f);
                            c.Item().BorderTop(0.5f).BorderColor(Colors.Black).AlignCenter().Text("DNI Técnico").Bold().FontSize(6.2f);
                        });
                    });

                    // =========================================================
                    // 10. LETRA PEQUEÑA - AUTORIZACIÓN Y PROTECCIÓN DE DATOS PERSONALES (LEY 29733)
                    // =========================================================
                    col.Item().PaddingTop(3).Column(legal =>
                    {
                        legal.Item().Text(
                            $"Usted autoriza a que sus datos sean almacenados, de manera indefinida o hasta que revoque la presente autorización, en una base de datos de {nombreEmpresa}. Estos datos son utilizados para envío y contacto de comunicaciones y encuestas referidas a los servicios ofrecidos por {nombreEmpresa} a través de distintos medios físicos o electrónicos. La autorización para el tratamiento de sus datos personales resulta obligatoria para la ejecución de dichas actividades, y en caso de negativa, ellas no se podrán realizar."
                        ).FontSize(5.4f).FontColor(Colors.Grey.Darken4).LineHeight(1.1f);

                        legal.Item().PaddingTop(1.5f).Text(
                            $"El tratamiento de sus datos será realizado por {nombreEmpresa} o un tercero designado por éste conforme a los términos y finalidades del presente consentimiento y podrán ser compartidos con otras empresas designadas por {nombreEmpresa} dentro y fuera del territorio nacional. Usted tiene la facultad de revocar su consentimiento o ejercer los derechos de la Ley 29733, de manera gratuita, enviando un correo a {emailLegal}."
                        ).FontSize(5.4f).FontColor(Colors.Grey.Darken4).LineHeight(1.1f);
                    });

                    // Marca de pie de documento
                    col.Item().PaddingTop(2).AlignRight().Text("Copia para el Cliente y Operaciones").FontSize(6f).Italic().FontColor(Colors.Grey.Medium);
                });
            });
        });

        return doc.GeneratePdf();
    }

    /// <summary>
    /// Renderiza un patrón visual nítido similar a un código de barras sin librerías externas.
    /// </summary>
    private static void RenderBarcodeVisual(ColumnDescriptor col, string text, float height)
    {
        if (string.IsNullOrWhiteSpace(text)) return;

        col.Item().Height(height).AlignCenter().Row(r =>
        {
            int seed = Math.Abs(text.GetHashCode());
            for (int i = 0; i < 32; i++)
            {
                bool isThick = ((seed >> (i % 24)) & 1) == 1;
                r.ConstantItem(isThick ? 2.2f : 1.1f).Height(height).Background(Colors.Black);
                r.ConstantItem(1.3f).Height(height); // separación
            }
        });
    }

    private static byte[]? ExtraerBytesImagen(string? base64String)
    {
        if (string.IsNullOrWhiteSpace(base64String))
            return null;

        try
        {
            var str = base64String.Trim();
            if (str.Contains(','))
            {
                str = str.Substring(str.IndexOf(',') + 1);
            }
            return Convert.FromBase64String(str);
        }
        catch
        {
            return null;
        }
    }
}
