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
using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

public class ServicioCampoImportProvider : IEntityImportProvider
{
    private readonly IServicioCampoDbContext _context;
    private readonly BubbaBag.SharedKernel.ICurrentUser _usuario;

    public ServicioCampoImportProvider(IServicioCampoDbContext context, BubbaBag.SharedKernel.ICurrentUser usuario)
    {
        _context = context;
        _usuario = usuario;
    }

    public IEnumerable<EntityImportDescriptorDto> GetDescriptors()
    {
        var descriptores = new List<EntityImportDescriptorDto>
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
                        new List<string> { "Inventario", "Servicio", "No inventario" }, null,
                        "tipo*", "tipo", "tipo de producto", "product type"),
                    new("Categoria", "Categoría", isRequired: false, isPrimary: false, type: "lookup", null, "Categorias",
                        "categoría", "categoria", "familia", "linea", "rubro", "category"),
                    new("GrupoUnidadMedida", "Grupo de unidades", isRequired: false, isPrimary: false, type: "lookup", null, "GruposUnidadMedida",
                        "grupo de unidades", "grupo unidad", "grupo de unidad", "unit group"),
                    new("UnidadMedida", "Unidad de Medida", isRequired: false, isPrimary: true, type: "lookup", null, "UnidadesMedida",
                        "unidad de medida*", "unidad de medida", "unidad", "um", "u.m.", "unit", "medida"),
                    new("DecimalesCantidad", "Decimales de cantidad (0-5)", isRequired: false, isPrimary: false, type: "integer", null, null,
                        "decimales de cantidad", "decimales cantidad", "cantidad decimales", "quantity decimals"),
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
            },

            // 5. UNIDADES ORGANIZATIVAS (SEDES)
            new()
            {
                EntityName = "UnidadOrganizativa",
                DisplayName = "Unidades Organizativas (Sedes)",
                Description = "Sedes físicas, bases territoriales y centros operativos de la organización.",
                IconName = "City",
                PrimaryKeyField = "Codigo",
                Fields = new List<EntityFieldDescriptorDto>
                {
                    new("Codigo", "Código*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "código*", "codigo", "código", "cod", "cod_sede", "sede_codigo", "code"),
                    new("Nombre", "Nombre de la Sede*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "nombre*", "nombre", "sede", "nombre sede", "nombre de la sede", "unidad organizativa", "nombre unidad"),
                    new("Ciudad", "Ciudad", isRequired: false, isPrimary: false, type: "text", null, null,
                        "ciudad", "provincia", "distrito", "city", "departamento"),
                    new("Direccion", "Dirección", isRequired: false, isPrimary: false, type: "text", null, null,
                        "dirección", "direccion", "address", "domicilio", "ubicacion"),
                    new("Telefono", "Teléfono", isRequired: false, isPrimary: false, type: "text", null, null,
                        "teléfono", "telefono", "phone", "celular", "tel"),
                    new("EsSedePrincipal", "Es Sede Principal", isRequired: false, isPrimary: false, type: "boolean", null, null,
                        "es sede principal", "sede principal", "principal", "es principal", "is main")
                }
            },

            // 6. TERRITORIOS (ZONAS OPERATIVAS)
            new()
            {
                EntityName = "Territorio",
                DisplayName = "Territorios (Zonas Operativas)",
                Description = "Zonas geográficas de cobertura técnica y despacho de órdenes de trabajo.",
                IconName = "MapPin",
                PrimaryKeyField = "Codigo",
                Fields = new List<EntityFieldDescriptorDto>
                {
                    new("Codigo", "Código*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "código*", "codigo", "código", "cod", "cod_territorio", "zona_codigo", "code", "territory code"),
                    new("Nombre", "Nombre del Territorio*", isRequired: true, isPrimary: true, type: "text", null, null,
                        "nombre*", "nombre", "territorio", "zona", "nombre territorio", "nombre zona", "territory name"),
                    new("UnidadOrganizativa", "Unidad Organizativa (Sede)*", isRequired: true, isPrimary: false, type: "lookup", null, "UnidadesOrganizativas",
                        "unidad organizativa*", "unidad organizativa", "sede*", "sede", "sucursal", "base", "organizational unit"),
                    new("AlmacenPredeterminado", "Almacén Predeterminado", isRequired: false, isPrimary: false, type: "lookup", null, "Almacenes",
                        "almacén predeterminado", "almacen predeterminado", "almacén", "almacen", "almacen base", "bodega", "warehouse"),
                    new("DescripcionProveedor", "Descripción / Cód. Proveedor", isRequired: false, isPrimary: false, type: "text", null, null,
                        "descripción / cód. proveedor", "descripción proveedor", "descripcion proveedor", "código proveedor", "codigo proveedor", "proveedor externo", "notas", "observaciones")
                }
            },

            // 7. INVENTARIO INICIAL (SALDO DE APERTURA)
            new()
            {
                EntityName = "InventarioInicial",
                DisplayName = "Inventario Inicial (Saldo de Apertura)",
                Description = "Carga de existencias iniciales con series y costos por almacén y ubicación.",
                IconName = "Cube",
                PrimaryKeyField = "Producto",
                Fields = new List<EntityFieldDescriptorDto>
                {
                    new("Almacen", "Almacén*", isRequired: true, isPrimary: false, type: "lookup", null, "Almacenes",
                        "almacén*", "almacen*", "almacén", "almacen", "bodega", "warehouse"),
                    new("Producto", "Código de Producto*", isRequired: true, isPrimary: true, type: "lookup", null, "Productos",
                        "código de producto*", "codigo de producto*", "producto*", "producto", "código", "codigo", "sku", "item"),
                    new("Cantidad", "Cantidad*", isRequired: true, isPrimary: false, type: "decimal", null, null,
                        "cantidad*", "cantidad", "stock", "stock inicial", "qty", "quantity"),
                    new("Ubicacion", "Ubicación", isRequired: false, isPrimary: false, type: "text", null, null,
                        "ubicación", "ubicacion", "zona", "estante", "rack", "location"),
                    new("CostoUnitario", "Costo Unitario", isRequired: false, isPrimary: false, type: "decimal", null, null,
                        "costo unitario", "costo", "unit cost", "cost"),
                    new("Series", "Números de Serie", isRequired: false, isPrimary: false, type: "text", null, null,
                        "números de serie", "numeros de serie", "series", "serie", "serials", "serial numbers"),
                    new("Condicion", "Condición", isRequired: false, isPrimary: false, type: "enum",
                        new List<string> { "Utilizable", "Dañado" }, null,
                        "condición", "condicion", "estado fisico", "condition"),
                    new("Observacion", "Observación / Motivo", isRequired: false, isPrimary: false, type: "text", null, null,
                        "observación / motivo", "observación", "observacion", "motivo", "notas", "comentario")
                }
            }
        };
        return descriptores.Where(x =>
            x.EntityName == "Cliente" ? _usuario.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Crm.ClientesCrear) :
            x.EntityName == "InventarioInicial" ? (_usuario.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.Operar) || _usuario.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.CatalogosGestionar)) :
            _usuario.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.CatalogosGestionar));
    }

    public bool Supports(string entityName)
    {
        return entityName.Equals("Producto", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("Categoria", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("UnidadMedida", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("Cliente", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("UnidadOrganizativa", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("Territorio", StringComparison.OrdinalIgnoreCase)
            || entityName.Equals("InventarioInicial", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<EntityImportExecutionResult> ImportAsync(
        string entityName,
        IReadOnlyList<Dictionary<string, string>> mappedRows,
        string duplicateMode,
        CancellationToken cancellationToken = default)
    {
        var permiso = entityName.Equals("Cliente", StringComparison.OrdinalIgnoreCase)
            ? BubbaBag.SharedKernel.Authorization.Permissions.Crm.ClientesCrear
            : entityName.Equals("InventarioInicial", StringComparison.OrdinalIgnoreCase)
                ? BubbaBag.SharedKernel.Authorization.Permissions.Inventario.Operar
                : BubbaBag.SharedKernel.Authorization.Permissions.Inventario.CatalogosGestionar;
        if (!_usuario.IsAuthenticated || (!_usuario.HasPermission(permiso) && !_usuario.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.CatalogosGestionar)))
            throw new UnauthorizedAccessException("No tiene permiso para importar esta entidad.");
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
        if (entityName.Equals("UnidadOrganizativa", StringComparison.OrdinalIgnoreCase))
        {
            return await ImportUnidadesOrganizativasAsync(mappedRows, duplicateMode, cancellationToken);
        }
        if (entityName.Equals("Territorio", StringComparison.OrdinalIgnoreCase))
        {
            return await ImportTerritoriosAsync(mappedRows, duplicateMode, cancellationToken);
        }
        if (entityName.Equals("InventarioInicial", StringComparison.OrdinalIgnoreCase))
        {
            return await ImportInventarioInicialAsync(mappedRows, duplicateMode, cancellationToken);
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
        var gruposDb = await _context.GruposUnidadMedida.ToListAsync(ct);
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
            Guid? categoriaProductoId = categoriasDb
                .FirstOrDefault(c => c.Nombre.Equals("Default", StringComparison.OrdinalIgnoreCase) && c.Activo)?.Id;
            if (!string.IsNullOrWhiteSpace(catStr))
            {
                var catDb = categoriasDb.FirstOrDefault(c => c.Nombre.Equals(catStr, StringComparison.OrdinalIgnoreCase));
                if (catDb == null)
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"La categoría '{catStr}' no existe en el catálogo.", codigo, "Categoria", catStr));
                    fallidos++;
                    continue;
                }
                categoriaProductoId = catDb.Id;
            }

            var umStr = GetVal(row, "UnidadMedida")?.Trim();
            var grupoStr = GetVal(row, "GrupoUnidadMedida")?.Trim();
            if (tipo == TipoProducto.Inventario && string.IsNullOrWhiteSpace(umStr))
            {
                errores.Add(new EntityImportRowError(rowNumber, "La Unidad de Medida es obligatoria.", codigo, "UnidadMedida"));
                fallidos++;
                continue;
            }

            UnidadMedida? umDb = null;
            if (!string.IsNullOrWhiteSpace(umStr))
            {
                Guid? grupoId = null;
                if (!string.IsNullOrWhiteSpace(grupoStr))
                {
                    grupoId = gruposDb.FirstOrDefault(g => g.Nombre.Equals(grupoStr, StringComparison.OrdinalIgnoreCase))?.Id;
                    if (!grupoId.HasValue)
                    {
                        errores.Add(new EntityImportRowError(rowNumber, $"El grupo de unidades '{grupoStr}' no existe en el catálogo.", codigo, "GrupoUnidadMedida", grupoStr));
                        fallidos++;
                        continue;
                    }
                }

                var coincidencias = unidadesDb.Where(u =>
                    u.Nombre.Equals(umStr, StringComparison.OrdinalIgnoreCase)
                    && (!grupoId.HasValue || u.GrupoUnidadMedidaId == grupoId.Value)).ToList();
                if (coincidencias.Count > 1)
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"La unidad '{umStr}' existe en varios grupos. Mapee también el Grupo de unidades.", codigo, "UnidadMedida", umStr));
                    fallidos++;
                    continue;
                }
                umDb = coincidencias.SingleOrDefault();
            }

            if (tipo == TipoProducto.Inventario && umDb == null)
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
            int? decimalesCantidad = null;
            var decimalesStr = GetVal(row, "DecimalesCantidad")?.Trim();
            if (!string.IsNullOrWhiteSpace(decimalesStr))
            {
                if (!int.TryParse(decimalesStr, out var decimales) || decimales is < 0 or > 5)
                {
                    errores.Add(new EntityImportRowError(rowNumber, "Los decimales de cantidad deben ser un número entero entre 0 y 5.", codigo, "DecimalesCantidad", decimalesStr));
                    fallidos++;
                    continue;
                }
                decimalesCantidad = decimales;
            }

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
                        categoriaProductoId,
                        grupoUnidadMedidaId: umDb?.GrupoUnidadMedidaId,
                        unidadMedidaDefectoId: umDb?.Id,
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
                        prodExistente.ListaPreciosPredeterminadaId,
                        decimalesCantidad ?? prodExistente.DecimalesCantidad);
                    exitosos++;
                }
            }
            else
            {
                var nuevo = Producto.Crear(
                    codigo,
                    nombre,
                    categoriaProductoId,
                    grupoUnidadMedidaId: umDb?.GrupoUnidadMedidaId,
                    unidadMedidaDefectoId: umDb?.Id,
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
                    decimalesCantidad: decimalesCantidad ?? 0);
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
            string? desc = GetVal(row, "Descripcion")?.Trim();

            if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(abrev))
            {
                errores.Add(new EntityImportRowError(rowNumber, "Código, Nombre y Abreviatura son obligatorios para Unidad de Medida.", codigo));
                fallidos++;
                continue;
            }

            // Importación de Unidades de Medida por archivo deprecada.
            // Las unidades ahora se crean desde la API de Grupos de Unidades de Medida.
            errores.Add(new EntityImportRowError(rowNumber, "Importación por archivo no disponible. Use la API de Grupos de Unidades de Medida.", codigo));
            fallidos++;
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

    private async Task<EntityImportExecutionResult> ImportUnidadesOrganizativasAsync(
        IReadOnlyList<Dictionary<string, string>> rows,
        string duplicateMode,
        CancellationToken ct)
    {
        var errores = new List<EntityImportRowError>();
        var sedesDb = await _context.UnidadesOrganizativas.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            int rowNumber = i + 2;
            var row = rows[i];

            string? codigo = GetVal(row, "Codigo")?.Trim().ToUpperInvariant();
            string? nombre = GetVal(row, "Nombre")?.Trim();
            string? ciudad = GetVal(row, "Ciudad")?.Trim();
            string? direccion = GetVal(row, "Direccion")?.Trim();
            string? telefono = GetVal(row, "Telefono")?.Trim();
            bool esSedePrincipal = ParseBoolean(GetVal(row, "EsSedePrincipal"));

            if (string.IsNullOrWhiteSpace(codigo))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El Código de la unidad organizativa es obligatorio.", null, "Codigo"));
                fallidos++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(nombre))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El Nombre de la unidad organizativa es obligatorio.", codigo, "Nombre"));
                fallidos++;
                continue;
            }

            var sedeExistente = sedesDb.FirstOrDefault(s => s.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));
            if (sedeExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"La unidad organizativa con código '{codigo}' ya existe.", codigo, "Codigo"));
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
                    sedeExistente.Actualizar(nombre, ciudad, direccion, telefono, esSedePrincipal);
                    exitosos++;
                }
            }
            else
            {
                var nueva = UnidadOrganizativa.Crear(codigo, nombre, ciudad, direccion, telefono, esSedePrincipal);
                _context.UnidadesOrganizativas.Add(nueva);
                sedesDb.Add(nueva);
                exitosos++;
            }
        }

        await _context.SaveChangesAsync(ct);
        return new EntityImportExecutionResult(rows.Count, exitosos, fallidos, parciales, errores);
    }

    private async Task<EntityImportExecutionResult> ImportTerritoriosAsync(
        IReadOnlyList<Dictionary<string, string>> rows,
        string duplicateMode,
        CancellationToken ct)
    {
        var errores = new List<EntityImportRowError>();
        var zonasDb = await _context.ZonasOperativas.ToListAsync(ct);
        var sedesDb = await _context.UnidadesOrganizativas.ToListAsync(ct);
        var almacenesDb = await _context.Almacenes.ToListAsync(ct);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            int rowNumber = i + 2;
            var row = rows[i];

            string? codigo = GetVal(row, "Codigo")?.Trim().ToUpperInvariant();
            string? nombre = GetVal(row, "Nombre")?.Trim();
            string? sedeStr = GetVal(row, "UnidadOrganizativa")?.Trim();
            string? almacenStr = GetVal(row, "AlmacenPredeterminado")?.Trim();
            string? descripcionProveedor = GetVal(row, "DescripcionProveedor")?.Trim();

            if (string.IsNullOrWhiteSpace(codigo))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El Código del territorio es obligatorio.", null, "Codigo"));
                fallidos++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(nombre))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El Nombre del territorio es obligatorio.", codigo, "Nombre"));
                fallidos++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(sedeStr))
            {
                errores.Add(new EntityImportRowError(rowNumber, "Debe especificar la Unidad Organizativa (Sede) a la que pertenece el territorio.", codigo, "UnidadOrganizativa"));
                fallidos++;
                continue;
            }

            var sede = sedesDb.FirstOrDefault(s =>
                s.Codigo.Equals(sedeStr, StringComparison.OrdinalIgnoreCase) ||
                s.Nombre.Equals(sedeStr, StringComparison.OrdinalIgnoreCase) ||
                (Guid.TryParse(sedeStr, out var sGuid) && s.Id == sGuid));

            if (sede == null)
            {
                errores.Add(new EntityImportRowError(rowNumber, $"No se encontró la Unidad Organizativa (Sede) '{sedeStr}'.", codigo, "UnidadOrganizativa", sedeStr));
                fallidos++;
                continue;
            }

            Guid? almacenId = null;
            if (!string.IsNullOrWhiteSpace(almacenStr))
            {
                var alm = almacenesDb.FirstOrDefault(a =>
                    (!string.IsNullOrEmpty(a.Codigo) && a.Codigo.Equals(almacenStr, StringComparison.OrdinalIgnoreCase)) ||
                    a.Nombre.Equals(almacenStr, StringComparison.OrdinalIgnoreCase) ||
                    (Guid.TryParse(almacenStr, out var aGuid) && a.Id == aGuid));

                if (alm != null)
                {
                    almacenId = alm.Id;
                }
            }

            var zonaExistente = zonasDb.FirstOrDefault(z => z.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase));
            if (zonaExistente != null)
            {
                if (duplicateMode.Equals("Error", StringComparison.OrdinalIgnoreCase))
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"El territorio con código '{codigo}' ya existe.", codigo, "Codigo"));
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
                    zonaExistente.Actualizar(nombre, sede.Id, almacenId ?? zonaExistente.AlmacenPredeterminadoId, descripcionProveedor);
                    exitosos++;
                }
            }
            else
            {
                var nueva = ZonaOperativa.Crear(codigo, nombre, sede.Id, almacenId, descripcionProveedor);
                _context.ZonasOperativas.Add(nueva);
                zonasDb.Add(nueva);
                exitosos++;
            }
        }

        await _context.SaveChangesAsync(ct);
        return new EntityImportExecutionResult(rows.Count, exitosos, fallidos, parciales, errores);
    }

    private async Task<EntityImportExecutionResult> ImportInventarioInicialAsync(
        IReadOnlyList<Dictionary<string, string>> rows,
        string duplicateMode,
        CancellationToken ct)
    {
        var errores = new List<EntityImportRowError>();
        var almacenesDb = await _context.Almacenes.Where(a => a.Activo).ToListAsync(ct);
        var productosDb = await _context.Productos.Where(p => p.Activo && p.Tipo == TipoProducto.Inventario).ToListAsync(ct);
        var ubicacionesDb = await _context.UbicacionesInventario.Where(u => u.Activa).ToListAsync(ct);
        var stocksDb = await _context.StocksAlmacen.ToListAsync(ct);
        var seriesExistentesDb = await _context.ItemsSeriados.Select(s => s.NumeroSerie).ToListAsync(ct);
        var seriesExistentesSet = new HashSet<string>(seriesExistentesDb, StringComparer.OrdinalIgnoreCase);

        int exitosos = 0;
        int fallidos = 0;
        int parciales = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            int rowNumber = i + 2;
            var row = rows[i];

            string? almacenStr = GetVal(row, "Almacen")?.Trim();
            string? productoStr = GetVal(row, "Producto")?.Trim().ToUpperInvariant();
            string? cantidadStr = GetVal(row, "Cantidad")?.Trim();

            if (string.IsNullOrWhiteSpace(almacenStr) && string.IsNullOrWhiteSpace(productoStr) && string.IsNullOrWhiteSpace(cantidadStr))
                continue;

            if (string.IsNullOrWhiteSpace(almacenStr))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El almacén es obligatorio.", productoStr, "Almacen"));
                fallidos++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(productoStr))
            {
                errores.Add(new EntityImportRowError(rowNumber, "El código del producto es obligatorio.", null, "Producto"));
                fallidos++;
                continue;
            }

            decimal cantidad = ParseDecimal(cantidadStr, 0m);
            if (cantidad <= 0)
            {
                errores.Add(new EntityImportRowError(rowNumber, "La cantidad debe ser mayor a 0.", productoStr, "Cantidad", cantidadStr));
                fallidos++;
                continue;
            }

            var almacen = almacenesDb.FirstOrDefault(a =>
                a.Codigo.Equals(almacenStr, StringComparison.OrdinalIgnoreCase) ||
                a.Nombre.Equals(almacenStr, StringComparison.OrdinalIgnoreCase));

            if (almacen == null)
            {
                errores.Add(new EntityImportRowError(rowNumber, $"No se encontró el almacén activo '{almacenStr}'.", productoStr, "Almacen", almacenStr));
                fallidos++;
                continue;
            }

            if (almacen.Tipo == TipoAlmacen.CustodiaPersonal)
            {
                errores.Add(new EntityImportRowError(rowNumber, "El inventario inicial solo puede cargarse en bodegas físicas, no en custodia personal.", productoStr, "Almacen", almacenStr));
                fallidos++;
                continue;
            }

            var producto = productosDb.FirstOrDefault(p =>
                p.Codigo.Equals(productoStr, StringComparison.OrdinalIgnoreCase));

            if (producto == null)
            {
                errores.Add(new EntityImportRowError(rowNumber, $"No se encontró el producto inventariable activo con código '{productoStr}'.", productoStr, "Producto", productoStr));
                fallidos++;
                continue;
            }

            // Ubicación dentro del almacén
            string? ubicacionStr = GetVal(row, "Ubicacion")?.Trim();
            UbicacionInventario? ubicacion = null;
            if (!string.IsNullOrWhiteSpace(ubicacionStr))
            {
                ubicacion = ubicacionesDb.FirstOrDefault(u => u.AlmacenId == almacen.Id &&
                    (u.Codigo.Equals(ubicacionStr, StringComparison.OrdinalIgnoreCase) || u.Nombre.Equals(ubicacionStr, StringComparison.OrdinalIgnoreCase)));
                if (ubicacion == null)
                {
                    ubicacion = UbicacionInventario.Crear(almacen.Id, ubicacionStr.ToUpperInvariant(), ubicacionStr);
                    _context.UbicacionesInventario.Add(ubicacion);
                    ubicacionesDb.Add(ubicacion);
                }
            }
            else
            {
                ubicacion = ubicacionesDb.FirstOrDefault(u => u.AlmacenId == almacen.Id && u.EsPrincipal);
                if (ubicacion == null)
                {
                    ubicacion = UbicacionInventario.Crear(almacen.Id, "PRINCIPAL", "Principal", true);
                    _context.UbicacionesInventario.Add(ubicacion);
                    ubicacionesDb.Add(ubicacion);
                }
            }

            // Condición física
            string? condStr = GetVal(row, "Condicion")?.Trim();
            CondicionInventario condicion = CondicionInventario.Utilizable;
            if (!string.IsNullOrWhiteSpace(condStr) && (condStr.Contains("Dañ", StringComparison.OrdinalIgnoreCase) || condStr.Contains("Defec", StringComparison.OrdinalIgnoreCase)))
            {
                condicion = CondicionInventario.Defectuoso;
            }

            // Validación de series si el producto es serializado
            List<string> seriesList = new();
            if (producto.EsSerializado)
            {
                string? seriesRaw = GetVal(row, "Series");
                if (!string.IsNullOrWhiteSpace(seriesRaw))
                {
                    seriesList = seriesRaw
                        .Split(new[] { ',', ';', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim().ToUpperInvariant())
                        .Where(s => !string.IsNullOrEmpty(s))
                        .Distinct()
                        .ToList();
                }

                if (seriesList.Count != (int)cantidad)
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"El producto '{producto.Nombre}' es serializado. Debe ingresar exactamente {cantidad} números de serie (se encontraron {seriesList.Count}).", productoStr, "Series"));
                    fallidos++;
                    continue;
                }

                var serieDuplicada = seriesList.FirstOrDefault(s => seriesExistentesSet.Contains(s));
                if (serieDuplicada != null)
                {
                    errores.Add(new EntityImportRowError(rowNumber, $"La serie '{serieDuplicada}' ya existe en el sistema.", productoStr, "Series", serieDuplicada));
                    fallidos++;
                    continue;
                }
            }

            decimal costoUnitario = ParseDecimal(GetVal(row, "CostoUnitario"), producto.CostoActual > 0 ? producto.CostoActual : producto.CostoEstandar);
            string observacion = GetVal(row, "Observacion")?.Trim() ?? "Carga de inventario inicial (Apertura)";

            // Aplicar alta de existencias
            var stock = stocksDb.FirstOrDefault(s => s.UbicacionId == ubicacion.Id && s.ProductoId == producto.Id && s.Condicion == condicion);
            if (stock == null)
            {
                stock = StockAlmacen.Crear(ubicacion.Id, producto.Id, cantidad, condicion);
                _context.StocksAlmacen.Add(stock);
                stocksDb.Add(stock);
            }
            else
            {
                stock.AumentarStock(cantidad);
            }

            // Registrar equipos seriados y su kardex
            foreach (var numSerie in seriesList)
            {
                var itemSeriado = ItemSeriado.Crear(producto.Id, numSerie, ubicacion.Id, null, null, observacion);
                _context.ItemsSeriados.Add(itemSeriado);
                seriesExistentesSet.Add(numSerie);

                var movSerie = MovimientoInventario.Registrar(
                    TipoMovimientoInventario.AjusteInventario,
                    producto.Id,
                    1m,
                    null,
                    almacen.Id,
                    itemSeriado.Id,
                    null,
                    null,
                    "SALDO-INICIAL",
                    _usuario.Id == Guid.Empty ? null : _usuario.Id,
                    observacion,
                    null,
                    ubicacion.Id,
                    null,
                    null,
                    DateTime.UtcNow,
                    condicion);
                _context.MovimientosInventario.Add(movSerie);
            }

            // Kardex para insumos no serializados
            if (!producto.EsSerializado)
            {
                var movInsumo = MovimientoInventario.Registrar(
                    TipoMovimientoInventario.AjusteInventario,
                    producto.Id,
                    cantidad,
                    null,
                    almacen.Id,
                    null,
                    null,
                    null,
                    "SALDO-INICIAL",
                    _usuario.Id == Guid.Empty ? null : _usuario.Id,
                    observacion,
                    null,
                    ubicacion.Id,
                    null,
                    null,
                    DateTime.UtcNow,
                    condicion);
                _context.MovimientosInventario.Add(movInsumo);
            }

            exitosos++;
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
