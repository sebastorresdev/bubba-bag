using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Services;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

public class InventarioExcelService : IInventarioExcelService
{
    private readonly IServicioCampoDbContext _context;

    public InventarioExcelService(IServicioCampoDbContext context)
    {
        _context = context;
    }

    #region 1. PRODUCTOS

    public async Task<byte[]> GenerarPlantillaProductosAsync(CancellationToken cancellationToken = default)
    {
        using var workbook = new XLWorkbook();

        // 1. Obtener datos de soporte de la BD
        var categorias = await _context.CategoriasProducto
            .Where(c => c.Activo)
            .OrderBy(c => c.Nombre)
            .Select(c => c.Nombre)
            .ToListAsync(cancellationToken);

        if (categorias.Count == 0)
        {
            categorias = new List<string> { "Materiales", "Equipos", "Insumos", "Herramientas", "Servicios" };
        }

        var unidades = await _context.UnidadesMedida
            .Where(u => u.Activo)
            .OrderBy(u => u.Nombre)
            .Select(u => u.Nombre)
            .ToListAsync(cancellationToken);

        if (unidades.Count == 0)
        {
            unidades = new List<string> { "Unidades", "Metros", "Kilogramos", "Cajas", "Rollos", "Servicios" };
        }

        var tipos = new List<string> { "Inventario", "Servicio", "No Inventariable" };
        var booleanos = new List<string> { "SI", "NO" };

        // 2. Hoja Oculta de Catálogos (para los Data Validation / Dropdowns de Excel)
        var wsCatalogos = workbook.Worksheets.Add("_Catalogos");
        wsCatalogos.Cell(1, 1).Value = "Categorias";
        wsCatalogos.Cell(1, 2).Value = "Unidades";
        wsCatalogos.Cell(1, 3).Value = "Tipos";
        wsCatalogos.Cell(1, 4).Value = "Booleanos";

        for (int i = 0; i < categorias.Count; i++) wsCatalogos.Cell(i + 2, 1).Value = categorias[i];
        for (int i = 0; i < unidades.Count; i++) wsCatalogos.Cell(i + 2, 2).Value = unidades[i];
        for (int i = 0; i < tipos.Count; i++) wsCatalogos.Cell(i + 2, 3).Value = tipos[i];
        for (int i = 0; i < booleanos.Count; i++) wsCatalogos.Cell(i + 2, 4).Value = booleanos[i];

        wsCatalogos.Visibility = XLWorksheetVisibility.Hidden;

        // 3. Hoja Principal de Productos
        var ws = workbook.Worksheets.Add("Productos");

        string[] headers =
        {
            "Código*",
            "Nombre del Producto*",
            "Tipo*",
            "Categoría*",
            "Unidad de Medida*",
            "Precio Base (S/)",
            "Costo Actual (S/)",
            "Costo Estándar (S/)",
            "Es Serializado",
            "Activo de Cliente",
            "Código de Barras",
            "Afecto a Impuesto",
            "Proveedor por Defecto",
            "Descripción / Especificaciones"
        };

        for (int col = 0; col < headers.Length; col++)
        {
            var cell = ws.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Font.FontSize = 11;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0078D4"); // Microsoft D365 Brand Blue
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }
        ws.Row(1).Height = 26;

        // 4. Data Validation (Dropdown selectors en Excel)
        int maxRows = 500;

        // Tipo: Columna C (3)
        var dvTipo = ws.Range(2, 3, maxRows, 3).CreateDataValidation();
        dvTipo.List(wsCatalogos.Range(2, 3, tipos.Count + 1, 3), true);
        dvTipo.InputTitle = "Tipo de Producto";
        dvTipo.InputMessage = "Seleccione el tipo del catálogo.";
        dvTipo.ErrorTitle = "Valor Inválido";
        dvTipo.ErrorMessage = "Debe elegir uno de los tipos permitidos.";

        // Categoría: Columna D (4)
        var dvCat = ws.Range(2, 4, maxRows, 4).CreateDataValidation();
        dvCat.List(wsCatalogos.Range(2, 1, categorias.Count + 1, 1), true);
        dvCat.InputTitle = "Categoría";
        dvCat.InputMessage = "Seleccione una categoría existente del catálogo.";
        dvCat.ErrorTitle = "Categoría no válida";
        dvCat.ErrorMessage = "Por favor elija una categoría de la lista desplegable.";

        // Unidad de Medida: Columna E (5)
        var dvUm = ws.Range(2, 5, maxRows, 5).CreateDataValidation();
        dvUm.List(wsCatalogos.Range(2, 2, unidades.Count + 1, 2), true);
        dvUm.InputTitle = "Unidad de Medida";
        dvUm.InputMessage = "Seleccione una unidad de medida del catálogo.";
        dvUm.ErrorTitle = "Unidad no válida";
        dvUm.ErrorMessage = "Por favor elija una unidad de la lista desplegable.";

        // Es Serializado: Columna I (9)
        var dvSerial = ws.Range(2, 9, maxRows, 9).CreateDataValidation();
        dvSerial.List("\"SI,NO\"", true);

        // Convertir en Activo de Cliente: Columna J (10)
        var dvActivo = ws.Range(2, 10, maxRows, 10).CreateDataValidation();
        dvActivo.List("\"SI,NO\"", true);

        // Afecto a Impuesto: Columna L (12)
        var dvImpuesto = ws.Range(2, 12, maxRows, 12).CreateDataValidation();
        dvImpuesto.List("\"SI,NO\"", true);

        // 5. Fila de ejemplo ilustrativa
        ws.Cell(2, 1).Value = "EQ-DEC-4K";
        ws.Cell(2, 2).Value = "Decodificador 4K Ultra HD";
        ws.Cell(2, 3).Value = "Inventario";
        ws.Cell(2, 4).Value = categorias[0];
        ws.Cell(2, 5).Value = unidades[0];
        ws.Cell(2, 6).Value = 180.00;
        ws.Cell(2, 7).Value = 95.00;
        ws.Cell(2, 8).Value = 90.00;
        ws.Cell(2, 9).Value = "SI";
        ws.Cell(2, 10).Value = "SI";
        ws.Cell(2, 11).Value = "775987654321";
        ws.Cell(2, 12).Value = "SI";
        ws.Cell(2, 13).Value = "Distribuidora Tech S.A.C.";
        ws.Cell(2, 14).Value = "Decodificador para instalaciones de TV satelital con soporte 4K";

        // Formatos de celdas
        ws.Range("F2:H500").Style.NumberFormat.Format = "#,##0.00";

        // Congelar panel y ajustar columnas
        ws.SheetView.FreezeRows(1);
        ws.Columns().AdjustToContents(14, 45);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public async Task<ImportarExcelResultadoDto> ImportarProductosAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        var resultado = new ImportarExcelResultadoDto();
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheet("Productos") ?? workbook.Worksheets.FirstOrDefault();

        if (ws == null)
        {
            resultado.Errores.Add(new ImportarErrorDto { Fila = 0, Mensaje = "El archivo no contiene ninguna hoja válida de Productos." });
            return resultado;
        }

        // Cargar listas en memoria para búsqueda rápida y evitar múltiples consultas
        var categoriasDb = await _context.CategoriasProducto.ToListAsync(cancellationToken);
        var unidadesDb = await _context.UnidadesMedida.ToListAsync(cancellationToken);
        var productosDb = await _context.Productos.ToListAsync(cancellationToken);

        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
        resultado.TotalFilas = Math.Max(0, lastRow - 1);

        for (int rowNum = 2; rowNum <= lastRow; rowNum++)
        {
            var row = ws.Row(rowNum);

            var codigo = row.Cell(1).GetString()?.Trim().ToUpperInvariant();
            var nombre = row.Cell(2).GetString()?.Trim();

            // Si ambos están vacíos, omitir fila en blanco
            if (string.IsNullOrWhiteSpace(codigo) && string.IsNullOrWhiteSpace(nombre))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(codigo))
            {
                resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Mensaje = "El Código es obligatorio." });
                continue;
            }

            if (string.IsNullOrWhiteSpace(nombre))
            {
                resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Codigo = codigo, Mensaje = "El Nombre del producto es obligatorio." });
                continue;
            }

            // Tipo
            var tipoStr = row.Cell(3).GetString()?.Trim();
            var tipo = TipoProducto.Inventario;
            if (!string.IsNullOrWhiteSpace(tipoStr))
            {
                if (tipoStr.Equals("Servicio", StringComparison.OrdinalIgnoreCase)) tipo = TipoProducto.Servicio;
                else if (tipoStr.Contains("No", StringComparison.OrdinalIgnoreCase))
                    tipo = TipoProducto.NoInventario;
            }

            // Categoría
            var categoriaStr = row.Cell(4).GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(categoriaStr)) categoriaStr = "Materiales";

            var catExistente = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(categoriaStr, StringComparison.OrdinalIgnoreCase));
            if (catExistente == null)
            {
                // Auto-crear la categoría para garantizar que no falle la importación
                catExistente = CategoriaProducto.Crear(categoriaStr);
                _context.CategoriasProducto.Add(catExistente);
                categoriasDb.Add(catExistente);
            }

            // Unidad de Medida
            var unidadStr = row.Cell(5).GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(unidadStr)) unidadStr = "Unidades";

            var umExistente = unidadesDb.FirstOrDefault(u =>
                u.Nombre.Equals(unidadStr, StringComparison.OrdinalIgnoreCase) ||
                u.Codigo.Equals(unidadStr, StringComparison.OrdinalIgnoreCase) ||
                u.Abreviatura.Equals(unidadStr, StringComparison.OrdinalIgnoreCase));

            if (umExistente == null)
            {
                // Auto-crear la unidad de medida si no existe
                string umCod = unidadStr.Length > 6 ? unidadStr.Substring(0, 6).ToUpperInvariant() : unidadStr.ToUpperInvariant();
                umExistente = UnidadMedida.Crear(umCod, unidadStr, unidadStr.ToLowerInvariant());
                _context.UnidadesMedida.Add(umExistente);
                unidadesDb.Add(umExistente);
            }

            // Numéricos
            decimal precioBase = ParseDecimal(row.Cell(6));
            decimal costoActual = ParseDecimal(row.Cell(7));
            decimal costoEstandar = ParseDecimal(row.Cell(8));

            // Booleans
            bool esSerializado = ParseBoolean(row.Cell(9).GetString());
            bool convertirActivo = ParseBoolean(row.Cell(10).GetString());
            var codigoBarras = row.Cell(11).GetString()?.Trim();
            bool afectoImpuesto = !row.Cell(12).IsEmpty() ? ParseBoolean(row.Cell(12).GetString()) : true;
            var proveedorDefecto = row.Cell(13).GetString()?.Trim();
            var descripcion = row.Cell(14).GetString()?.Trim();

            // Buscar producto por código
            var productoExistente = productosDb.FirstOrDefault(p => p.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));

            if (productoExistente != null)
            {
                productoExistente.Actualizar(
                    nombre: nombre,
                    categoria: catExistente.Nombre,
                    unidadMedida: umExistente.Nombre,
                    esSerializado: esSerializado,
                    descripcion: descripcion,
                    tipo: tipo,
                    precioBase: precioBase,
                    catalogoId: null,
                    convertirEnActivoCliente: convertirActivo,
                    codigoBarras: codigoBarras,
                    notas: null,
                    costoActual: costoActual,
                    costoEstandar: costoEstandar,
                    afectoImpuesto: afectoImpuesto,
                    proveedorDefecto: proveedorDefecto
                );
                resultado.Actualizados++;
            }
            else
            {
                var nuevoProducto = Producto.Crear(
                    codigo: codigo,
                    nombre: nombre,
                    categoria: catExistente.Nombre,
                    unidadMedida: umExistente.Nombre,
                    esSerializado: esSerializado,
                    descripcion: descripcion,
                    tipo: tipo,
                    precioBase: precioBase,
                    catalogoId: null,
                    convertirEnActivoCliente: convertirActivo,
                    codigoBarras: codigoBarras,
                    notas: null,
                    costoActual: costoActual,
                    costoEstandar: costoEstandar,
                    afectoImpuesto: afectoImpuesto,
                    proveedorDefecto: proveedorDefecto
                );
                _context.Productos.Add(nuevoProducto);
                productosDb.Add(nuevoProducto);
                resultado.Creados++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return resultado;
    }

    #endregion

    #region 2. CATEGORÍAS

    public async Task<byte[]> GenerarPlantillaCategoriasAsync(CancellationToken cancellationToken = default)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Categorias");

        string[] headers =
        {
            "Nombre de la Categoría*",
            "Familia / Grupo",
            "Descripción"
        };

        for (int col = 0; col < headers.Length; col++)
        {
            var cell = ws.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Font.FontSize = 11;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0078D4");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }
        ws.Row(1).Height = 26;

        // Filas de ejemplo
        ws.Cell(2, 1).Value = "Equipos de Telecomunicación";
        ws.Cell(2, 2).Value = "Equipos y Terminales";
        ws.Cell(2, 3).Value = "Decodificadores, routers, módems y terminales de abonado";

        ws.Cell(3, 1).Value = "Cables y Conectores";
        ws.Cell(3, 2).Value = "Materiales de Instalación";
        ws.Cell(3, 3).Value = "Cables coaxiales RG6, conectores de compresión y empalmes";

        ws.SheetView.FreezeRows(1);
        ws.Columns().AdjustToContents(18, 50);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public async Task<ImportarExcelResultadoDto> ImportarCategoriasAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        var resultado = new ImportarExcelResultadoDto();
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheet("Categorias") ?? workbook.Worksheets.FirstOrDefault();

        if (ws == null)
        {
            resultado.Errores.Add(new ImportarErrorDto { Fila = 0, Mensaje = "El archivo no contiene ninguna hoja válida de Categorías." });
            return resultado;
        }

        var categoriasDb = await _context.CategoriasProducto.ToListAsync(cancellationToken);
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
        resultado.TotalFilas = Math.Max(0, lastRow - 1);

        for (int rowNum = 2; rowNum <= lastRow; rowNum++)
        {
            var row = ws.Row(rowNum);
            var nombre = row.Cell(1).GetString()?.Trim();
            var familia = row.Cell(2).GetString()?.Trim();
            var descripcion = row.Cell(3).GetString()?.Trim();

            if (string.IsNullOrWhiteSpace(nombre))
            {
                // Si la fila está totalmente vacía la ignoramos
                if (string.IsNullOrWhiteSpace(familia) && string.IsNullOrWhiteSpace(descripcion))
                    continue;

                resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Mensaje = "El Nombre de la categoría es obligatorio." });
                continue;
            }

            var existente = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase));
            if (existente != null)
            {
                existente.Actualizar(nombre, familia, descripcion);
                resultado.Actualizados++;
            }
            else
            {
                var nueva = CategoriaProducto.Crear(nombre, familia, descripcion);
                _context.CategoriasProducto.Add(nueva);
                categoriasDb.Add(nueva);
                resultado.Creados++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return resultado;
    }

    #endregion

    #region 3. UNIDADES DE MEDIDA

    public async Task<byte[]> GenerarPlantillaUnidadesMedidaAsync(CancellationToken cancellationToken = default)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("UnidadesMedida");

        string[] headers =
        {
            "Código*",
            "Nombre de Unidad*",
            "Abreviatura*",
            "Permite Decimales*",
            "Descripción"
        };

        for (int col = 0; col < headers.Length; col++)
        {
            var cell = ws.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Font.FontSize = 11;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0078D4");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }
        ws.Row(1).Height = 26;

        // Data validation para columna D (Permite Decimales)
        var dvDec = ws.Range(2, 4, 300, 4).CreateDataValidation();
        dvDec.List("\"SI,NO\"", true);
        dvDec.InputTitle = "Permite Decimales";
        dvDec.InputMessage = "Seleccione si la unidad permite fracciones (SI/NO).";

        // Filas de ejemplo
        ws.Cell(2, 1).Value = "UND";
        ws.Cell(2, 2).Value = "Unidad";
        ws.Cell(2, 3).Value = "und";
        ws.Cell(2, 4).Value = "NO";
        ws.Cell(2, 5).Value = "Unidad contable indivisible para equipos y accesorios";

        ws.Cell(3, 1).Value = "MTR";
        ws.Cell(3, 2).Value = "Metro";
        ws.Cell(3, 3).Value = "m";
        ws.Cell(3, 4).Value = "SI";
        ws.Cell(3, 5).Value = "Medida de longitud para cableado y fibra óptica";

        ws.SheetView.FreezeRows(1);
        ws.Columns().AdjustToContents(16, 45);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public async Task<ImportarExcelResultadoDto> ImportarUnidadesMedidaAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        var resultado = new ImportarExcelResultadoDto();
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheet("UnidadesMedida") ?? workbook.Worksheets.FirstOrDefault();

        if (ws == null)
        {
            resultado.Errores.Add(new ImportarErrorDto { Fila = 0, Mensaje = "El archivo no contiene ninguna hoja válida de Unidades de Medida." });
            return resultado;
        }

        var unidadesDb = await _context.UnidadesMedida.ToListAsync(cancellationToken);
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
        resultado.TotalFilas = Math.Max(0, lastRow - 1);

        for (int rowNum = 2; rowNum <= lastRow; rowNum++)
        {
            var row = ws.Row(rowNum);
            var codigo = row.Cell(1).GetString()?.Trim().ToUpperInvariant();
            var nombre = row.Cell(2).GetString()?.Trim();
            var abreviatura = row.Cell(3).GetString()?.Trim();
            var permiteDecStr = row.Cell(4).GetString()?.Trim();
            var descripcion = row.Cell(5).GetString()?.Trim();

            if (string.IsNullOrWhiteSpace(codigo) && string.IsNullOrWhiteSpace(nombre))
                continue;

            if (string.IsNullOrWhiteSpace(codigo))
            {
                resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Mensaje = "El Código de la unidad es obligatorio." });
                continue;
            }

            if (string.IsNullOrWhiteSpace(nombre))
            {
                resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Codigo = codigo, Mensaje = "El Nombre de la unidad es obligatorio." });
                continue;
            }

            if (string.IsNullOrWhiteSpace(abreviatura))
            {
                abreviatura = codigo.ToLowerInvariant();
            }

            bool permiteDecimales = ParseBoolean(permiteDecStr);

            var existente = unidadesDb.FirstOrDefault(u => u.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));
            if (existente != null)
            {
                existente.Actualizar(nombre, abreviatura, permiteDecimales, descripcion);
                resultado.Actualizados++;
            }
            else
            {
                var nueva = UnidadMedida.Crear(codigo, nombre, abreviatura, permiteDecimales, descripcion);
                _context.UnidadesMedida.Add(nueva);
                unidadesDb.Add(nueva);
                resultado.Creados++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return resultado;
    }

    #endregion

    #region Helpers

    private static decimal ParseDecimal(IXLCell cell)
    {
        if (cell.IsEmpty()) return 0m;
        if (cell.DataType == XLDataType.Number) return Convert.ToDecimal(cell.GetDouble());

        var valStr = cell.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(valStr)) return 0m;

        // Normalizar comas y puntos
        valStr = valStr.Replace("S/", "").Replace("$", "").Trim();
        if (decimal.TryParse(valStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var invRes))
            return Math.Max(0, invRes);

        if (decimal.TryParse(valStr, NumberStyles.Any, new CultureInfo("es-PE"), out var peRes))
            return Math.Max(0, peRes);

        return 0m;
    }

    private static bool ParseBoolean(string? val)
    {
        if (string.IsNullOrWhiteSpace(val)) return false;
        var trimmed = val.Trim().ToUpperInvariant();
        return trimmed is "SI" or "S" or "TRUE" or "VERDADERO" or "1";
    }

    #endregion
}
