using System;
using System.IO;
using System.Linq;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciaDetalle;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Configuracion;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

public static class CargoPdfGenerator
{
    static CargoPdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] GenerarCargo(
        TransferenciaDetalladaDto transferencia,
        ConfiguracionEmpresa? empresa,
        TipoAlmacen tipoOrigen,
        TipoAlmacen tipoDestino,
        string? dniReceptor = null)
    {
        bool esDespacho = tipoOrigen == TipoAlmacen.Bodega && tipoDestino == TipoAlmacen.CustodiaPersonal;
        bool esDevolucion = tipoOrigen == TipoAlmacen.CustodiaPersonal && tipoDestino == TipoAlmacen.Bodega;
        bool esTraslado = !esDespacho && !esDevolucion;

        string tituloDocumento = esDespacho
            ? "CARGO DE ENTREGA Y CUSTODIA (DESPACHO)"
            : esDevolucion
                ? "ACTA DE DEVOLUCIÓN DE MATERIALES (REINGRESO)"
                : "GUÍA DE TRASLADO INTERNO ENTRE ALMACENES";

        string subTitulo = esDespacho
            ? "Dotación y entrega de herramientas y materiales a personal técnico"
            : esDevolucion
                ? "Retorno de materiales sobrantes y equipos averiados a bodega"
                : "Movimiento de existencias entre dependencias y almacenes";

        string nombreEmpresa = empresa?.RazonSocial ?? "BUBBA BAG LOGISTICS";
        string? rucEmpresa = empresa?.Ruc;
        string? direccionEmpresa = empresa?.DireccionFiscal;
        string? telefonoEmpresa = empresa?.Telefono;
        string? emailEmpresa = empresa?.Email;
        string? pieEmpresa = empresa?.PiePaginaDocumentos ?? "Documento oficial de control y custodia de existencias.";

        byte[]? logoBytes = null;
        if (!string.IsNullOrWhiteSpace(empresa?.LogoBase64))
        {
            try
            {
                var base64 = empresa.LogoBase64;
                if (base64.Contains(','))
                {
                    base64 = base64.Substring(base64.IndexOf(',') + 1);
                }
                logoBytes = Convert.FromBase64String(base64);
            }
            catch
            {
                logoBytes = null;
            }
        }

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

                // ==================== HEADER ====================
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        // Columna Izquierda: Logo
                        row.ConstantItem(120).Height(50).Element(logoContainer =>
                        {
                            if (logoBytes != null && logoBytes.Length > 0)
                            {
                                logoContainer.MaxHeight(48).MaxWidth(110).Image(logoBytes);
                            }
                            else
                            {
                                logoContainer
                                    .Border(1)
                                    .BorderColor(Colors.Grey.Lighten1)
                                    .Background(Colors.Grey.Lighten4)
                                    .AlignCenter()
                                    .AlignMiddle()
                                    .Text("LOGO")
                                    .FontSize(14)
                                    .Bold()
                                    .FontColor(Colors.Grey.Medium);
                            }
                        });

                        // Columna Centro: Datos de la Empresa
                        row.RelativeItem().PaddingLeft(10).Column(c =>
                        {
                            c.Item().Text(nombreEmpresa).Bold().FontSize(12).FontColor(Colors.Blue.Darken3);
                            if (!string.IsNullOrWhiteSpace(rucEmpresa))
                                c.Item().Text($"R.U.C. / Identificación: {rucEmpresa}").FontSize(8).FontColor(Colors.Grey.Darken2);
                            if (!string.IsNullOrWhiteSpace(direccionEmpresa))
                                c.Item().Text(direccionEmpresa).FontSize(8).FontColor(Colors.Grey.Darken2);
                            if (!string.IsNullOrWhiteSpace(telefonoEmpresa) || !string.IsNullOrWhiteSpace(emailEmpresa))
                            {
                                var contacto = string.Join(" | ", new[] { telefonoEmpresa, emailEmpresa }.Where(s => !string.IsNullOrWhiteSpace(s)));
                                c.Item().Text(contacto).FontSize(8).FontColor(Colors.Grey.Darken2);
                            }
                        });

                        // Columna Derecha: Tarjeta de Número de Cargo
                        row.ConstantItem(170).Border(1.5f).BorderColor(Colors.Blue.Darken2).Background(Colors.Blue.Lighten5).Padding(6).Column(c =>
                        {
                            c.Item().AlignCenter().Text(tituloDocumento).Bold().FontSize(8).FontColor(Colors.Blue.Darken4);
                            c.Item().AlignCenter().Text(transferencia.Numero).Bold().FontSize(11).FontColor(Colors.Red.Darken2);
                            c.Item().AlignCenter().Text($"Fecha: {transferencia.FechaReal:dd/MM/yyyy HH:mm}").FontSize(8);
                            c.Item().AlignCenter().Text($"Estado: {transferencia.Estado}").FontSize(8).FontColor(Colors.Green.Darken3);
                        });
                    });

                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                // ==================== CONTENT ====================
                page.Content().PaddingVertical(10).Column(col =>
                {
                    // Título explicativo
                    col.Item().Text(subTitulo).Italic().FontSize(8.5f).FontColor(Colors.Grey.Darken1);

                    // Bloque Datos de los Involucrados
                    col.Item().PaddingTop(6).Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(8).Row(r =>
                    {
                        // Emisor / Origen
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text("ORIGEN / DESPACHO").Bold().FontSize(8.5f).FontColor(Colors.Blue.Darken3);
                            c.Item().Text($"Almacén: {transferencia.AlmacenOrigenNombre}").Bold();
                            if (!string.IsNullOrWhiteSpace(transferencia.UbicacionOrigenNombre))
                                c.Item().Text($"Ubicación: {transferencia.UbicacionOrigenNombre}");
                            c.Item().Text($"Responsable: {transferencia.DespachadoPorNombre ?? "Almacenero autorizado"}");
                        });

                        // Receptor / Destino
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text("DESTINO / RECEPTOR").Bold().FontSize(8.5f).FontColor(Colors.Blue.Darken3);
                            c.Item().Text($"Destino: {transferencia.AlmacenDestinoNombre}").Bold();
                            if (!string.IsNullOrWhiteSpace(transferencia.UbicacionDestinoNombre))
                                c.Item().Text($"Ubicación: {transferencia.UbicacionDestinoNombre}");
                            if (!string.IsNullOrWhiteSpace(dniReceptor))
                                c.Item().Text($"Doc. Identidad / DNI: {dniReceptor}");
                            c.Item().Text($"Modalidad: {transferencia.Modalidad}");
                        });

                        // Datos adicionales
                        if (!string.IsNullOrWhiteSpace(transferencia.NumeroGuiaRemision) || !string.IsNullOrWhiteSpace(transferencia.Observaciones))
                        {
                            r.RelativeItem().Column(c =>
                            {
                                c.Item().Text("REFERENCIAS").Bold().FontSize(8.5f).FontColor(Colors.Blue.Darken3);
                                if (!string.IsNullOrWhiteSpace(transferencia.NumeroGuiaRemision))
                                    c.Item().Text($"Guía Remisión: {transferencia.NumeroGuiaRemision}").Bold();
                                if (!string.IsNullOrWhiteSpace(transferencia.Observaciones))
                                    c.Item().Text($"Obs: {transferencia.Observaciones}");
                            });
                        }
                    });

                    // Tabla de Materiales
                    col.Item().PaddingTop(12).Text("DETALLE DE MATERIALES Y EQUIPOS").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);

                    col.Item().PaddingTop(4).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(24);  // #
                            columns.ConstantColumn(85);  // Código
                            columns.RelativeColumn(3);   // Descripción
                            columns.ConstantColumn(45);  // Cant.
                            columns.ConstantColumn(45);  // Unidad
                            columns.ConstantColumn(65);  // Condición
                            columns.RelativeColumn(3);   // Series
                        });

                        // Header de la tabla
                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Blue.Darken3).Padding(4).AlignCenter().Text("#").Bold().FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken3).Padding(4).Text("CÓDIGO").Bold().FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken3).Padding(4).Text("DESCRIPCIÓN").Bold().FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken3).Padding(4).AlignCenter().Text("CANT.").Bold().FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken3).Padding(4).AlignCenter().Text("UNID.").Bold().FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken3).Padding(4).AlignCenter().Text("CONDICIÓN").Bold().FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken3).Padding(4).Text("SERIES ASIGNADAS").Bold().FontColor(Colors.White);
                        });

                        int itemIndex = 1;
                        decimal totalUnidades = 0;

                        foreach (var linea in transferencia.Lineas)
                        {
                            totalUnidades += linea.CantidadEnviada;
                            var rowBg = itemIndex % 2 == 0 ? Colors.Grey.Lighten5 : Colors.White;

                            table.Cell().Background(rowBg).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4).AlignCenter().Text(itemIndex.ToString());
                            table.Cell().Background(rowBg).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4).Text(linea.CodigoProducto).Bold();
                            table.Cell().Background(rowBg).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4).Text(linea.ProductoNombre);
                            table.Cell().Background(rowBg).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4).AlignCenter().Text(linea.CantidadEnviada.ToString("0.##")).Bold();
                            table.Cell().Background(rowBg).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4).AlignCenter().Text(linea.UnidadMedidaNombre ?? "UND");
                            
                            // Condición con color
                            var esDefectuoso = linea.Condicion.Contains("Defectuoso", StringComparison.OrdinalIgnoreCase);
                            table.Cell().Background(rowBg).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4).AlignCenter()
                                .Text(linea.Condicion).FontColor(esDefectuoso ? Colors.Red.Darken2 : Colors.Green.Darken2).Bold();

                            // Series formateadas
                            var seriesList = (linea.Series ?? Array.Empty<SerieTransferenciaDto>()).Select(s => s.NumeroSerie).ToList();
                            var seriesTexto = seriesList.Count > 0 ? string.Join(", ", seriesList) : "-";

                            table.Cell().Background(rowBg).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(4)
                                .Text(seriesTexto).FontSize(7.5f).FontColor(Colors.Grey.Darken3);

                            itemIndex++;
                        }

                        // Fila de resumen total
                        table.Cell().ColumnSpan(3).Background(Colors.Grey.Lighten3).Padding(4).AlignRight().Text("TOTALES:").Bold();
                        table.Cell().Background(Colors.Grey.Lighten3).Padding(4).AlignCenter().Text(totalUnidades.ToString("0.##")).Bold();
                        table.Cell().ColumnSpan(3).Background(Colors.Grey.Lighten3).Padding(4).Text($"{transferencia.Lineas.Count} ítem(s) registrados").FontSize(8);
                    });

                    // Cláusula de Conformidad y Responsabilidad
                    col.Item().PaddingTop(14).Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(6).Column(c =>
                    {
                        c.Item().Text("CLÁUSULA DE CONFORMIDAD Y CUSTODIA").Bold().FontSize(7.5f).FontColor(Colors.Grey.Darken3);
                        string clausula = esDespacho
                            ? "El receptor declara haber recibido en conformidad y perfecto estado de conservación los materiales y herramientas arriba listados, asumiendo la responsabilidad directa de su custodia, cuidado y buen uso en las operaciones asignadas."
                            : esDevolucion
                                ? "El almacén receptor declara haber recibido e inspeccionado físicamente los materiales retornados, procediendo con el reingreso al inventario general según la condición declarada (Utilizable / Defectuoso)."
                                : "Los responsables de los almacenes involucrados certifican la salida y recepción conforme del material trasladado entre sedes.";
                        c.Item().Text(clausula).FontSize(7.5f).Italic().FontColor(Colors.Grey.Darken2);
                    });

                    // Sección de Firmas (Side by side)
                    col.Item().PaddingTop(25).Row(r =>
                    {
                        r.RelativeItem().PaddingRight(20).Column(c =>
                        {
                            c.Item().AlignCenter().Text("___________________________________________").FontColor(Colors.Grey.Darken1);
                            c.Item().AlignCenter().Text("ENTREGADO POR (ALMACÉN / DESPACHO)").Bold().FontSize(8).FontColor(Colors.Blue.Darken3);
                            c.Item().AlignCenter().Text($"Nombre: {transferencia.DespachadoPorNombre ?? "Responsable de Bodega"}").FontSize(8);
                            c.Item().AlignCenter().Text("Firma y Sello").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                        });

                        r.RelativeItem().PaddingLeft(20).Column(c =>
                        {
                            c.Item().AlignCenter().Text("___________________________________________").FontColor(Colors.Grey.Darken1);
                            c.Item().AlignCenter().Text("RECIBIDO POR (RECEPTOR / TÉCNICO)").Bold().FontSize(8).FontColor(Colors.Blue.Darken3);
                            c.Item().AlignCenter().Text($"Nombre: {transferencia.AlmacenDestinoNombre}").FontSize(8);
                            if (!string.IsNullOrWhiteSpace(dniReceptor))
                                c.Item().AlignCenter().Text($"DNI / Doc: {dniReceptor}").FontSize(8);
                            c.Item().AlignCenter().Text("Firma, DNI y Huella Digital").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                        });
                    });
                });

                // ==================== FOOTER ====================
                page.Footer().Column(col =>
                {
                    col.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    col.Item().PaddingTop(4).Row(r =>
                    {
                        r.RelativeItem().Text(pieEmpresa).FontSize(7.5f).FontColor(Colors.Grey.Medium);
                        r.RelativeItem().AlignRight().Text(text =>
                        {
                            text.Span("Página ").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                            text.CurrentPageNumber().FontSize(7.5f).FontColor(Colors.Grey.Medium);
                            text.Span(" de ").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                            text.TotalPages().FontSize(7.5f).FontColor(Colors.Grey.Medium);
                        });
                    });
                });
            });
        });

        return doc.GeneratePdf();
    }
}
