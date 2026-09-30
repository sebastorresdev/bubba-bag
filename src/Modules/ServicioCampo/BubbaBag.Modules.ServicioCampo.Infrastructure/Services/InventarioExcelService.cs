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

        // 1. Obtener datos reales de la BD
        var categorias = await _context.CategoriasProducto
            .Where(c => c.Activo)
            .OrderBy(c => c.Nombre)
            .Select(c => c.Nombre)
            .ToListAsync(cancellationToken);

        var unidades = await _context.UnidadesMedida
            .Where(u => u.EstaActivo)
            .OrderBy(u => u.GrupoUnidadMedida!.Nombre).ThenBy(u => u.Nombre)
            .Select(u => new { Grupo = u.GrupoUnidadMedida!.Nombre, Unidad = u.Nombre })
            .ToListAsync(cancellationToken);

        var grupos = unidades.Select(u => u.Grupo).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var nombresUnidades = unidades.Select(u => u.Unidad).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        var tipos = new List<string> { "Inventario", "Servicio", "No inventario" };
        var booleanos = new List<string> { "SI", "NO" };

        // 2. Hoja Oculta de Catálogos (para los Data Validation / Dropdowns de Excel)
        var wsCatalogos = workbook.Worksheets.Add("_Catalogos");
        wsCatalogos.Cell(1, 1).Value = "Categorias";
        wsCatalogos.Cell(1, 2).Value = "GruposUnidades";
        wsCatalogos.Cell(1, 3).Value = "Unidades";
        wsCatalogos.Cell(1, 4).Value = "Tipos";
        wsCatalogos.Cell(1, 5).Value = "Booleanos";

        for (int i = 0; i < categorias.Count; i++) wsCatalogos.Cell(i + 2, 1).Value = categorias[i];
        for (int i = 0; i < grupos.Count; i++) wsCatalogos.Cell(i + 2, 2).Value = grupos[i];
        for (int i = 0; i < nombresUnidades.Count; i++) wsCatalogos.Cell(i + 2, 3).Value = nombresUnidades[i];
        for (int i = 0; i < tipos.Count; i++) wsCatalogos.Cell(i + 2, 4).Value = tipos[i];
        for (int i = 0; i < booleanos.Count; i++) wsCatalogos.Cell(i + 2, 5).Value = booleanos[i];

        wsCatalogos.Visibility = XLWorksheetVisibility.Hidden;

        // 3. Hoja Principal de Productos
        var ws = workbook.Worksheets.Add("Productos");

        string[] headers =
        {
            "Código*",
            "Nombre del Producto*",
            "Tipo*",
            "Categoría",
            "Grupo de unidades",
            "Unidad de Medida",
            "Precio Base (S/)",
            "Costo Actual (S/)",
            "Costo Estándar (S/)",
            "Es Serializado",
            "Código de Barras",
            "Afecto a Impuesto",
            "Proveedor por Defecto",
            "Descripción / Especificaciones",
            "Decimales de cantidad (0-5)"
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
        dvTipo.List(wsCatalogos.Range(2, 4, tipos.Count + 1, 4), true);
        dvTipo.InputTitle = "Tipo de Producto";
        dvTipo.InputMessage = "Seleccione el tipo del catálogo.";
        dvTipo.ErrorTitle = "Valor Inválido";
        dvTipo.ErrorMessage = "Debe elegir uno de los tipos permitidos.";

        // Categoría: Columna D (4) - Solo si existen categorías reales en BD
        if (categorias.Count > 0)
        {
            var dvCat = ws.Range(2, 4, maxRows, 4).CreateDataValidation();
            dvCat.List(wsCatalogos.Range(2, 1, categorias.Count + 1, 1), true);
            dvCat.InputTitle = "Categoría";
            dvCat.InputMessage = "Seleccione una categoría existente del catálogo.";
            dvCat.ErrorTitle = "Categoría no válida";
            dvCat.ErrorMessage = "Por favor elija una categoría de la lista desplegable.";
        }

        if (grupos.Count > 0)
        {
            var dvUm = ws.Range(2, 5, maxRows, 5).CreateDataValidation();
            dvUm.List(wsCatalogos.Range(2, 2, grupos.Count + 1, 2), true);
            dvUm.InputTitle = "Grupo de unidades";
            dvUm.InputMessage = "Seleccione el grupo al que pertenece la unidad.";
        }

        if (nombresUnidades.Count > 0)
        {
            var dvUm = ws.Range(2, 6, maxRows, 6).CreateDataValidation();
            dvUm.List(wsCatalogos.Range(2, 3, nombresUnidades.Count + 1, 3), true);
            dvUm.InputTitle = "Unidad de Medida";
            dvUm.InputMessage = "Seleccione una unidad de medida del catálogo.";
            dvUm.ErrorTitle = "Unidad no válida";
            dvUm.ErrorMessage = "Por favor elija una unidad de la lista desplegable.";
        }

        var dvSerial = ws.Range(2, 10, maxRows, 10).CreateDataValidation();
        dvSerial.List("\"SI,NO\"", true);

        var dvImpuesto = ws.Range(2, 12, maxRows, 12).CreateDataValidation();
        dvImpuesto.List("\"SI,NO\"", true);

        ws.Range("G2:I500").Style.NumberFormat.Format = "#,##0.00";

        // Congelar panel y ajustar columnas
        ws.SheetView.FreezeRows(1);
        ws.Columns().AdjustToContents(15, 45);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public async Task<ImportarExcelResultadoDto> ImportarProductosAsync(
        Stream stream,
        bool actualizarExistentes = false,
        CancellationToken cancellationToken = default)
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
        var gruposDb = await _context.GruposUnidadMedida.ToListAsync(cancellationToken);
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

            // Categoría (Opcional pero debe existir si se especifica)
            var categoriaStr = row.Cell(4).GetString()?.Trim();
            Guid? categoriaProductoId = categoriasDb
                .FirstOrDefault(c => c.Nombre.Equals("Default", StringComparison.OrdinalIgnoreCase) && c.Activo)?.Id;
            if (!string.IsNullOrWhiteSpace(categoriaStr))
            {
                var catExistente = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(categoriaStr, StringComparison.OrdinalIgnoreCase));
                if (catExistente == null)
                {
                    resultado.Errores.Add(new ImportarErrorDto
                    {
                        Fila = rowNum,
                        Codigo = codigo,
                        Mensaje = $"La categoría '{categoriaStr}' no existe en el catálogo. Debe crearla previamente."
                    });
                    continue;
                }
                categoriaProductoId = catExistente.Id;
            }

            var formatoConGrupo = ws.Cell(1, 5).GetString().Contains("Grupo", StringComparison.OrdinalIgnoreCase);
            var grupoStr = formatoConGrupo ? row.Cell(5).GetString()?.Trim() : null;
            var unidadStr = row.Cell(formatoConGrupo ? 6 : 5).GetString()?.Trim();
            if (tipo == TipoProducto.Inventario && string.IsNullOrWhiteSpace(unidadStr))
            {
                resultado.Errores.Add(new ImportarErrorDto
                {
                    Fila = rowNum,
                    Codigo = codigo,
                    Mensaje = "La Unidad de Medida es obligatoria."
                });
                continue;
            }

            UnidadMedida? umExistente = null;
            if (!string.IsNullOrWhiteSpace(unidadStr))
            {
                Guid? grupoId = null;
                if (!string.IsNullOrWhiteSpace(grupoStr))
                {
                    grupoId = gruposDb.FirstOrDefault(g => g.Nombre.Equals(grupoStr, StringComparison.OrdinalIgnoreCase))?.Id;
                    if (!grupoId.HasValue)
                    {
                        resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Codigo = codigo, Mensaje = $"El grupo de unidades '{grupoStr}' no existe en el catálogo." });
                        continue;
                    }
                }

                var coincidencias = unidadesDb.Where(u =>
                    u.Nombre.Equals(unidadStr, StringComparison.OrdinalIgnoreCase)
                    && (!grupoId.HasValue || u.GrupoUnidadMedidaId == grupoId.Value)).ToList();
                if (coincidencias.Count > 1)
                {
                    resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Codigo = codigo, Mensaje = $"La unidad '{unidadStr}' existe en varios grupos. Especifique el Grupo de unidades." });
                    continue;
                }
                umExistente = coincidencias.SingleOrDefault();
            }

            if (tipo == TipoProducto.Inventario && umExistente == null)
            {
                resultado.Errores.Add(new ImportarErrorDto
                {
                    Fila = rowNum,
                    Codigo = codigo,
                    Mensaje = $"La unidad de medida '{unidadStr}' no existe en el catálogo. Debe crearla previamente."
                });
                continue;
            }

            // Numéricos
            var desplazamiento = formatoConGrupo ? 1 : 0;
            decimal precioBase = ParseDecimal(row.Cell(6 + desplazamiento));
            decimal costoActual = ParseDecimal(row.Cell(7 + desplazamiento));
            decimal costoEstandar = ParseDecimal(row.Cell(8 + desplazamiento));

            // Booleans y Strings con soporte retrocompatible
            bool formatoAntiguoConActivo = !formatoConGrupo && (ws.Cell(1, 10).GetString()?.Trim().Contains("Activo", StringComparison.OrdinalIgnoreCase) ?? false);

            bool esSerializado = ParseBoolean(row.Cell(9 + desplazamiento).GetString());
            string? codigoBarras;
            bool afectoImpuesto;
            string? proveedorDefecto;
            string? descripcion;
            int? decimalesCantidad = null;
            var columnaDecimales = 14 + desplazamiento;
            bool tieneColumnaDecimales = ws.Cell(1, columnaDecimales).GetString().Contains("Decimales", StringComparison.OrdinalIgnoreCase);
            if (tieneColumnaDecimales && !row.Cell(columnaDecimales).IsEmpty())
            {
                if (!int.TryParse(row.Cell(columnaDecimales).GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var decimales) || decimales is < 0 or > 5)
                {
                    resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Codigo = codigo, Mensaje = "Los decimales de cantidad deben ser un número entero entre 0 y 5." });
                    continue;
                }
                decimalesCantidad = decimales;
            }

            if (formatoAntiguoConActivo)
            {
                // Formato antiguo con la columna Activo y sin precisión por producto.
                codigoBarras = row.Cell(11).GetString()?.Trim();
                afectoImpuesto = !row.Cell(12).IsEmpty() ? ParseBoolean(row.Cell(12).GetString()) : true;
                proveedorDefecto = row.Cell(13).GetString()?.Trim();
                descripcion = row.Cell(14).GetString()?.Trim();
            }
            else
            {
                // Formato estándar sin Activo; incluye la precisión opcional en la columna 14.
                codigoBarras = row.Cell(10 + desplazamiento).GetString()?.Trim();
                afectoImpuesto = !row.Cell(11 + desplazamiento).IsEmpty() ? ParseBoolean(row.Cell(11 + desplazamiento).GetString()) : true;
                proveedorDefecto = row.Cell(12 + desplazamiento).GetString()?.Trim();
                descripcion = row.Cell(13 + desplazamiento).GetString()?.Trim();
            }

            // Buscar producto por código
            var productoExistente = productosDb.FirstOrDefault(p => p.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));

            if (productoExistente != null)
            {
                if (!actualizarExistentes)
                {
                    resultado.Omitidos++;
                    resultado.Errores.Add(new ImportarErrorDto
                    {
                        Fila = rowNum,
                        Codigo = codigo,
                        Mensaje = $"El producto '{codigo}' ya existe en el sistema. Se omitió porque no se seleccionó 'Actualizar existentes'."
                    });
                    continue;
                }

                productoExistente.Actualizar(
                    nombre: nombre,
                    categoriaProductoId: categoriaProductoId,
                    grupoUnidadMedidaId: umExistente?.GrupoUnidadMedidaId,
                    unidadMedidaDefectoId: umExistente?.Id,
                    esSerializado: esSerializado,
                    descripcion: descripcion,
                    tipo: tipo,
                    precioBase: precioBase,
                    codigoBarras: codigoBarras,
                    notas: null,
                    costoActual: costoActual,
                    costoEstandar: costoEstandar,
                    afectoImpuesto: afectoImpuesto,
                    proveedorDefecto: proveedorDefecto,
                    decimalesCantidad: decimalesCantidad ?? productoExistente.DecimalesCantidad
                );
                resultado.Actualizados++;
            }
            else
            {
                var nuevoProducto = Producto.Crear(
                    codigo: codigo,
                    nombre: nombre,
                    categoriaProductoId: categoriaProductoId,
                    grupoUnidadMedidaId: umExistente?.GrupoUnidadMedidaId,
                    unidadMedidaDefectoId: umExistente?.Id,
                    esSerializado: esSerializado,
                    descripcion: descripcion,
                    tipo: tipo,
                    precioBase: precioBase,
                    codigoBarras: codigoBarras,
                    notas: null,
                    costoActual: costoActual,
                    costoEstandar: costoEstandar,
                    afectoImpuesto: afectoImpuesto,
                    proveedorDefecto: proveedorDefecto,
                    decimalesCantidad: decimalesCantidad ?? 0
                );
                _context.Productos.Add(nuevoProducto);
                productosDb.Add(nuevoProducto);
                resultado.Creados++;
            }
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException dbEx)
        {
            var detalle = dbEx.InnerException?.Message ?? dbEx.Message;
            if (dbEx.InnerException is Npgsql.PostgresException pgEx)
            {
                if (pgEx.SqlState == "23502")
                    detalle = $"Falta un campo obligatorio en la base de datos: columna '{pgEx.ColumnName ?? "desconocida"}' en tabla '{pgEx.TableName ?? "desconocida"}'.";
                else if (pgEx.SqlState == "23505")
                    detalle = $"Ya existe un registro con clave única duplicada ({pgEx.ConstraintName}).";
            }
            resultado.Errores.Add(new ImportarErrorDto { Fila = 0, Mensaje = $"Error al guardar en base de datos: {detalle}" });
            resultado.Creados = 0;
            resultado.Actualizados = 0;
        }
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
            "Categoría Padre",
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
        ws.Cell(2, 1).Value = "Equipos y Terminales";
        ws.Cell(2, 2).Value = ""; // Raíz
        ws.Cell(2, 3).Value = "Categoría principal de hardware telecom";

        ws.Cell(3, 1).Value = "Decodificadores HD";
        ws.Cell(3, 2).Value = "Equipos y Terminales";
        ws.Cell(3, 3).Value = "Receptores satelitales con decodificación de alta definición";

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
            var padreStr = row.Cell(2).GetString()?.Trim();
            var descripcion = row.Cell(3).GetString()?.Trim();

            if (string.IsNullOrWhiteSpace(nombre))
            {
                // Si la fila está totalmente vacía la ignoramos
                if (string.IsNullOrWhiteSpace(padreStr) && string.IsNullOrWhiteSpace(descripcion))
                    continue;

                resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Mensaje = "El Nombre de la categoría es obligatorio." });
                continue;
            }

            Guid? categoriaPadreId = null;
            if (!string.IsNullOrWhiteSpace(padreStr))
            {
                var padreExistente = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(padreStr, StringComparison.OrdinalIgnoreCase));
                if (padreExistente == null)
                {
                    padreExistente = CategoriaProducto.Crear(padreStr);
                    _context.CategoriasProducto.Add(padreExistente);
                    categoriasDb.Add(padreExistente);
                }
                categoriaPadreId = padreExistente.Id;
            }

            var existente = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase));
            if (existente != null)
            {
                existente.Actualizar(nombre, categoriaPadreId, descripcion);
                resultado.Actualizados++;
            }
            else
            {
                var nueva = CategoriaProducto.Crear(nombre, categoriaPadreId, descripcion);
                _context.CategoriasProducto.Add(nueva);
                categoriasDb.Add(nueva);
                resultado.Creados++;
            }
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException dbEx)
        {
            var detalle = dbEx.InnerException?.Message ?? dbEx.Message;
            resultado.Errores.Add(new ImportarErrorDto { Fila = 0, Mensaje = $"Error al guardar categorías en base de datos: {detalle}" });
            resultado.Creados = 0;
            resultado.Actualizados = 0;
        }
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
        ws.Cell(2, 1).Value = "UND";
        ws.Cell(2, 2).Value = "Unidad";
        ws.Cell(2, 3).Value = "und";
        ws.Cell(2, 4).Value = "Unidad contable para equipos y accesorios";

        ws.Cell(3, 1).Value = "MTR";
        ws.Cell(3, 2).Value = "Metro";
        ws.Cell(3, 3).Value = "m";
        ws.Cell(3, 4).Value = "Medida de longitud para cableado y fibra óptica";

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
            var cuartaColumna = ws.Cell(1, 4).GetString();
            var descripcion = cuartaColumna.Contains("Descrip", StringComparison.OrdinalIgnoreCase)
                ? row.Cell(4).GetString()?.Trim()
                : row.Cell(5).GetString()?.Trim();

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

            // La importación de unidades por Excel fue deprecada con la introducción de GrupoUnidadMedida.
            // Las unidades ahora se gestionan a través de la API de Grupos de Unidades de Medida.
            resultado.Errores.Add(new ImportarErrorDto { Fila = rowNum, Codigo = codigo, Mensaje = "La importación por Excel de Unidades de Medida ya no está disponible. Use la API de Grupos de Unidades de Medida." });
            continue;
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
