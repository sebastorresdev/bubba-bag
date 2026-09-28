using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.GestionDatos.Application.Dtos;
using BubbaBag.Modules.GestionDatos.Application.Services;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

public class ServicioCampoImportProvider : IEntityImportProvider
{
    private readonly IServicioCampoDbContext _context;

    public ServicioCampoImportProvider(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public IEnumerable<EntityImportDescriptorDto> GetDescriptors()
    {
        return new List<EntityImportDescriptorDto>
        {
            // 1. PRODUCTOS
            new()
            {
                EntityName = "Producto",
                DisplayName = "Productos y Servicios",
                Description = "Catálogo maestro de artículos, materiales, repuestos y servicios comerciales.",
                IconName = "Box",
                PrimaryKeyField = "Codigo",
                Fields = new List<EntityFieldDescriptorDto>
                {
                    new("Codigo", "Código*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "codigo", "código", "sku", "item", "código*", "cod", "cod_producto", "part_number", "part number", "codigo producto"),
                    new("Nombre", "Nombre del Producto*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "nombre del producto*", "nombre", "nombre del producto", "nombre producto", "producto", "item name", "description"),
                    new("Tipo", "Tipo*", isRequired: false, isPrimary: false, type: "enum",
                        new List<string> { "Inventario", "Servicio", "No Inventariable" }, null,
                        "tipo*", "tipo", "tipo de producto", "product type"),
                    new("Categoria", "Categoría", isRequired: false, isPrimary: false, type: "lookup", null, "Categorias",
                        "categoría", "categoria", "familia", "linea", "rubro", "category"),
                    new("UnidadMedida", "Unidad de Medida*", isRequired: true, isPrimary: true, type: "lookup", null, "UnidadesMedida",
                        "unidad de medida*", "unidad de medida", "unidad", "um", "u.m.", "unit", "medida"),
                    new("PrecioBase", "Precio Base (S/)", isRequired: false, isPrimary: false, type: "decimal", null, null,
                        "precio base (s/)", "precio base", "precio", "p.venta", "precio venta", "price", "precio de venta"),
                    new("CostoActual", "Costo Actual (S/)", isRequired: false, isPrimary: false, type: "decimal", null, null,
                        "costo actual (s/)", "costo actual", "costo", "cost", "current cost"),
                    new("CostoEstandar", "Costo Estándar (S/)", isRequired: false, isPrimary: false, type: "decimal", null, null,
                        "costo estándar (s/)", "costo estandar", "costo estandar (s/)", "standard cost"),
                    new("EsSerializado", "Es Serializado", isRequired: false, isPrimary: false, type: "boolean", null, null,
                        "es serializado", "serializado", "serie", "has serial", "is serialized"),
                    new("CodigoBarras", "Código de Barras", isRequired: false, isPrimary: false, type: "text", null, null,
                        "código de barras", "codigo de barras", "barcode", "upc", "ean", "ean13"),
                    new("AfectoImpuesto", "Afecto a Impuesto", isRequired: false, isPrimary: false, type: "boolean", null, null,
                        "afecto a impuesto", "afecto", "igv", "impuesto", "taxable"),
                    new("ProveedorDefecto", "Proveedor por Defecto", isRequired: false, isPrimary: false, type: "text", null, null,
                        "proveedor por defecto", "proveedor", "vendor", "supplier"),
                    new("Descripcion", "Descripción / Especificaciones", isRequired: false, isPrimary: false, type: "text", null, null,
                        "descripción / especificaciones", "descripcion", "descripción", "notas", "especificaciones", "detalles")
                }
            },

            // 2. CATEGORÍAS
            new()
            {
                EntityName = "Categoria",
                DisplayName = "Categorías de Productos",
                Description = "Familias y agrupaciones taxonómicas para inventario y servicios.",
                IconName = "Tag",
                PrimaryKeyField = "Nombre",
                Fields = new List<EntityFieldDescriptorDto>
                {
                    new("Nombre", "Nombre de Categoría*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "nombre*", "nombre", "nombre de categoria", "categoria", "categoría", "familia"),
                    new("Descripcion", "Descripción", isRequired: false, isPrimary: false, type: "text", null, null,
                        "descripcion", "descripción", "detalle")
                }
            },

            // 3. UNIDADES DE MEDIDA
            new()
            {
                EntityName = "UnidadMedida",
                DisplayName = "Unidades de Medida",
                Description = "Unidades físicas y de presentación para artículos (UND, MTR, ROL, KGM, etc.).",
                IconName = "Ruler",
                PrimaryKeyField = "Codigo",
                Fields = new List<EntityFieldDescriptorDto>
                {
                    new("Codigo", "Código*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "código*", "codigo", "cod", "código", "code"),
                    new("Nombre", "Nombre de la Unidad*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "nombre*", "nombre", "nombre unidad", "unidad"),
                    new("Abreviatura", "Abreviatura*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "abreviatura*", "abreviatura", "abrev", "simbolo", "symbol"),
                    new("PermiteDecimales", "Permite Decimales", isRequired: false, isPrimary: false, type: "boolean", null, null,
                        "permite decimales", "fraccionable", "decimales", "permite fraccion"),
                    new("Descripcion", "Descripción", isRequired: false, isPrimary: false, type: "text", null, null,
                        "descripcion", "descripción", "detalle")
                }
            },

            // 4. CLIENTES
            new()
            {
                EntityName = "Cliente",
                DisplayName = "Cuentas y Clientes",
                Description = "Clientes finales, empresas corporativas y puntos de servicio.",
                IconName = "People",
                PrimaryKeyField = "DocumentoIdentidad",
                Fields = new List<EntityFieldDescriptorDto>
                {
                    new("DocumentoIdentidad", "Documento de Identidad*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "documento de identidad*", "documento", "documento identidad", "dni", "ruc", "identificacion", "doc"),
                    new("Nombres", "Nombres / Razón Social*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "nombres*", "nombres", "razón social", "razon social", "cliente", "nombre cliente", "nombre o razon social"),
                    new("TelefonoPrincipal", "Teléfono Principal*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "teléfono principal*", "telefono principal", "telefono", "teléfono", "celular", "movil", "phone"),
                    new("Direccion", "Dirección*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "dirección*", "direccion", "dirección", "address", "domicilio"),
                    new("Apellidos", "Apellidos", isRequired: false, isPrimary: false, type: "text", null, null,
                        "apellidos", "apellido", "last name"),
                    new("TipoPersona", "Tipo de Persona", isRequired: false, isPrimary: false, type: "enum",
                        new List<string> { "NATURAL", "JURIDICA" }, null,
                        "tipo de persona", "tipo persona", "persona"),
                    new("TipoDocumento", "Tipo de Documento", isRequired: false, isPrimary: false, type: "enum",
                        new List<string> { "DNI", "RUC", "CE" }, null,
                        "tipo de documento", "tipo documento", "tipo doc"),
                    new("Email", "Correo Electrónico", isRequired: false, isPrimary: false, type: "text", null, null,
                        "correo electrónico", "correo", "email", "mail"),
                    new("TelefonoSecundario", "Teléfono Secundario", isRequired: false, isPrimary: false, type: "text", null, null,
                        "teléfono secundario", "telefono secundario", "celular 2", "telefono 2"),
                    new("UbigeoCodigo", "Código Ubigeo", isRequired: false, isPrimary: false, type: "text", null, null,
                        "código ubigeo", "codigo ubigeo", "ubigeo", "cod ubigeo"),
                    new("ReferenciaUbicacion", "Referencia de Ubicación", isRequired: false, isPrimary: false, type: "text", null, null,
                        "referencia de ubicación", "referencia", "referencia ubicacion")
                }
            }
        };
    }

    public bool Supports(string entityName)
    {
        return entityName.Equals("Producto", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("Categoria", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("UnidadMedida", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("Cliente", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<EntityImportExecutionResult> ImportAsync(
        string entityName,
        IReadOnlyList<Dictionary<string, string>> mappedRows,
        string duplicateMode,
        CancellationToken cancellationToken = default)
    {
        if (entityName.Equals("Producto", StringComparison.OrdinalIgnoreCase))
        {
            return await ImportProductosAsync(mappedRows, duplicateMode, cancellationToken);
        }
        if (entityName.Equals("Categoria", StringComparison.OrdinalIgnoreCase))
        {
            return await ImportCategoriasAsync(mappedRows, duplicateMode, cancellationToken);
        }
        if (entityName.Equals("UnidadMedida", StringComparison.OrdinalIgnoreCase))
        {
            return await ImportUnidadesMedidaAsync(mappedRows, duplicateMode, cancellationToken);
        }
        if (entityName.Equals("Cliente", StringComparison.OrdinalIgnoreCase))
        {
            return await ImportClientesAsync(mappedRows, duplicateMode, cancellationToken);
        }

        throw new NotSupportedException($"La entidad '{entityName}' no es soportada por este proveedor.");
    }

    #region IMPORTERS

    private async Task<EntityImportExecutionResult> ImportProductosAsync(
        IReadOnlyList<Dictionary<string, string>> rows,
        string duplicateMode,
        CancellationToken ct)
    {
        var errores = new List<EntityImportRowError>();
        var categoriasDb = await _context.CategoriasProducto.ToListAsync(ct);
        var unidadesDb = await _context.UnidadesMedida.ToListAsync(ct);
        var productosDb = await _context.Productos.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            int rowNumber = i + 2;
            var row = rows[i];

            string? codigo = GetVal(row, "Codigo")?.Trim().ToUpperInvariant();
            string? nombre = GetVal(row, "Nombre")?.Trim();

            if (string.IsNullOrWhiteSpace(codigo) && string.IsNullOrWhiteSpace(nombre))
                continue;

            if (string.IsNullOrWhiteSpace(codigo))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El campo Código es obligatorio.", codigo, "Codigo"));
                fallidos++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(nombre))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El Nombre del producto es obligatorio.", codigo, "Nombre"));
                fallidos++;
                continue;
            }

            var tipoStr = GetVal(row, "Tipo")?.Trim();
            var tipo = TipoProducto.Inventario;
            if (!string.IsNullOrWhiteSpace(tipoStr))
            {
                if (tipoStr.Equals("Servicio", StringComparison.OrdinalIgnoreCase)) tipo = TipoProducto.Servicio;
                else if (tipoStr.Contains("No", StringComparison.OrdinalIgnoreCase)) tipo = TipoProducto.NoInventario;
            }

            var catStr = GetVal(row, "Categoria")?.Trim();
            string? catFinal = null;
            if (!string.IsNullOrWhiteSpace(catStr))
            {
                var catDb = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(catStr, StringComparison.OrdinalIgnoreCase));
                if (catDb == null)
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"La categoría '{catStr}' no existe en el catálogo.", codigo, "Categoria", catStr));
                    fallidos++;
                    continue;
                }
                catFinal = catDb.Nombre;
            }

            var umStr = GetVal(row, "UnidadMedida")?.Trim();
            if (string.IsNullOrWhiteSpace(umStr))
            {
                errores.Add(new EntityImportRowError(rowNumber, "La Unidad de Medida es obligatoria.", codigo, "UnidadMedida"));
                fallidos++;
                continue;
            }

            var umDb = unidadesDb.FirstOrDefault(u =>
                u.Nombre.Equals(umStr, StringComparison.OrdinalIgnoreCase) ||
                u.Codigo.Equals(umStr, StringComparison.OrdinalIgnoreCase) ||
                u.Abreviatura.Equals(umStr, StringComparison.OrdinalIgnoreCase));

            if (umDb == null)
            {
                errores.Add(new EntityImportRowError(rowNumber, $"La unidad de medida '{umStr}' no existe en el catálogo.", codigo, "UnidadMedida", umStr));
                fallidos++;
                continue;
            }

            decimal precioBase = ParseDecimal(GetVal(row, "PrecioBase"));
            decimal costoActual = ParseDecimal(GetVal(row, "CostoActual"));
            decimal costoEstandar = ParseDecimal(GetVal(row, "CostoEstandar"));
            bool esSerializado = ParseBoolean(GetVal(row, "EsSerializado"));
            bool afectoImpuesto = ParseBoolean(GetVal(row, "AfectoImpuesto"), defaultValue: true);
            string? codigoBarras = GetVal(row, "CodigoBarras")?.Trim();
            string? proveedor = GetVal(row, "ProveedorDefecto")?.Trim();
            string? descripcion = GetVal(row, "Descripcion")?.Trim();

            var prodExistente = productosDb.FirstOrDefault(p => p.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));

            if (prodExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"El producto con código '{codigo}' ya existe.", codigo, "Codigo"));
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
                    prodExistente.Actualizar(
                        nombre,
                        catFinal,
                        umDb.Nombre,
                        esSerializado,
                        descripcion,
                        tipo,
                        precioBase,
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

        await _context.SaveChangesAsync(ct);
        return new EntityImportExecutionResult(rows.Count, exitosos, fallidos, parciales, errores);
    }

    private async Task<EntityImportExecutionResult> ImportCategoriasAsync(
        IReadOnlyList<Dictionary<string, string>> rows,
        string duplicateMode,
        CancellationToken ct)
    {
        var errores = new List<EntityImportRowError>();
        var categoriasDb = await _context.CategoriasProducto.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            int rowNumber = i + 2;
            var row = rows[i];

            string? nombre = GetVal(row, "Nombre")?.Trim();
            string? descripcion = GetVal(row, "Descripcion")?.Trim();

            if (string.IsNullOrWhiteSpace(nombre))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El Nombre de la categoría es obligatorio.", null, "Nombre"));
                fallidos++;
                continue;
            }

            var catExistente = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase));
            if (catExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"La categoría '{nombre}' ya existe.", nombre, "Nombre"));
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

        await _context.SaveChangesAsync(ct);
        return new EntityImportExecutionResult(rows.Count, exitosos, fallidos, parciales, errores);
    }

    private async Task<EntityImportExecutionResult> ImportUnidadesMedidaAsync(
        IReadOnlyList<Dictionary<string, string>> rows,
        string duplicateMode,
        CancellationToken ct)
    {
        var errores = new List<EntityImportRowError>();
        var unidadesDb = await _context.UnidadesMedida.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            int rowNumber = i + 2;
            var row = rows[i];

            string? codigo = GetVal(row, "Codigo")?.Trim().ToUpperInvariant();
            string? nombre = GetVal(row, "Nombre")?.Trim();
            string? abrev = GetVal(row, "Abreviatura")?.Trim();
            bool permiteDecimales = ParseBoolean(GetVal(row, "PermiteDecimales"));
            string? desc = GetVal(row, "Descripcion")?.Trim();

            if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(abrev))
            {
                errores.Add(new EntityImportRowError(rowNumber, "Código, Nombre y Abreviatura son obligatorios para Unidad de Medida.", codigo));
                fallidos++;
                continue;
            }

            var umExistente = unidadesDb.FirstOrDefault(u => u.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));
            if (umExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"La unidad con código '{codigo}' ya existe.", codigo));
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

        await _context.SaveChangesAsync(ct);
        return new EntityImportExecutionResult(rows.Count, exitosos, fallidos, parciales, errores);
    }

    private async Task<EntityImportExecutionResult> ImportClientesAsync(
        IReadOnlyList<Dictionary<string, string>> rows,
        string duplicateMode,
        CancellationToken ct)
    {
        var errores = new List<EntityImportRowError>();
        var clientesDb = await _context.Clientes.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            int rowNumber = i + 2;
            var row = rows[i];

            string? doc = GetVal(row, "DocumentoIdentidad")?.Trim();
            string? nombres = GetVal(row, "Nombres")?.Trim();
            string? apellidos = GetVal(row, "Apellidos")?.Trim();
            string? tel = GetVal(row, "TelefonoPrincipal")?.Trim();
            string? direccion = GetVal(row, "Direccion")?.Trim();
            string? tipoPersona = GetVal(row, "TipoPersona")?.Trim() ?? "NATURAL";
            string? tipoDoc = GetVal(row, "TipoDocumento")?.Trim() ?? "DNI";
            string? email = GetVal(row, "Email")?.Trim();
            string? tel2 = GetVal(row, "TelefonoSecundario")?.Trim();
            string? ubigeo = GetVal(row, "UbigeoCodigo")?.Trim() ?? "";
            string? refUbicacion = GetVal(row, "ReferenciaUbicacion")?.Trim();

            if (string.IsNullOrWhiteSpace(doc) || string.IsNullOrWhiteSpace(nombres) || string.IsNullOrWhiteSpace(tel) || string.IsNullOrWhiteSpace(direccion))
            {
                errores.Add(new EntityImportRowError(rowNumber, "Documento de Identidad, Nombres, Teléfono Principal y Dirección son obligatorios.", doc));
                fallidos++;
                continue;
            }

            var cliExistente = clientesDb.FirstOrDefault(c => c.DocumentoIdentidad.Equals(doc, StringComparison.OrdinalIgnoreCase));
            if (cliExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"El cliente con documento '{doc}' ya existe.", doc));
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
                        nombres: nombres,
                        apellidos: apellidos,
                        telefonoPrincipal: tel,
                        direccion: direccion,
                        ubigeoCodigo: ubigeo,
                        tipoDocumento: tipoDoc,
                        tipoPersona: tipoPersona,
                        razonSocial: tipoPersona.Equals("JURIDICA", StringComparison.OrdinalIgnoreCase) ? nombres : null,
                        telefonoSecundario: tel2,
                        email: email,
                        referencia: refUbicacion);
                    exitosos++;
                }
            }
            else
            {
                var nuevo = Cliente.Crear(
                    codigoCliente: $"CLI-{doc}",
                    documentoIdentidad: doc,
                    nombres: nombres,
                    apellidos: apellidos,
                    telefonoPrincipal: tel,
                    direccion: direccion,
                    ubigeoCodigo: ubigeo,
                    esClienteFacturacion: false,
                    esClienteServicio: true,
                    tipoDocumento: tipoDoc,
                    tipoPersona: tipoPersona,
                    razonSocial: tipoPersona.Equals("JURIDICA", StringComparison.OrdinalIgnoreCase) ? nombres : null,
                    telefonoSecundario: tel2,
                    email: email,
                    referencia: refUbicacion);
                _context.Clientes.Add(nuevo);
                clientesDb.Add(nuevo);
                exitosos++;
            }
        }

        await _context.SaveChangesAsync(ct);
        return new EntityImportExecutionResult(rows.Count, exitosos, fallidos, parciales, errores);
    }

    #endregion

    #region UTILS

    private static string? GetVal(Dictionary<string, string> row, string key)
    {
        if (row.TryGetValue(key, out var val))
            return val;
        return null;
    }

    private static decimal ParseDecimal(string? val, decimal defaultValue = 0m)
    {
        if (string.IsNullOrWhiteSpace(val)) return defaultValue;
        var clean = val.Replace("S/", "", StringComparison.OrdinalIgnoreCase)
                       .Replace("$", "")
                       .Replace("€", "")
                       .Trim();

        if (decimal.TryParse(clean, NumberStyles.Any, CultureInfo.InvariantCulture, out var d1)) return d1;
        if (decimal.TryParse(clean, NumberStyles.Any, new CultureInfo("es-PE"), out var d2)) return d2;
        return defaultValue;
    }

    private static bool ParseBoolean(string? val, bool defaultValue = false)
    {
        if (string.IsNullOrWhiteSpace(val)) return defaultValue;
        var s = val.Trim().ToLowerInvariant();
        if (s == "1" || s == "si" || s == "sí" || s == "true" || s == "yes" || s == "v" || s == "verdadero") return true;
        if (s == "0" || s == "no" || s == "false" || s == "f" || s == "falso") return false;
        return defaultValue;
    }

    #endregion
}

