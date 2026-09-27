using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Services;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Services;

public class EntityImportMetadataService : IEntityImportMetadataService
{
    private readonly List<EntityImportDescriptorDto> _descriptors;

    public EntityImportMetadataService()
    {
        _descriptors = new List<EntityImportDescriptorDto>
        {
            // 1. PRODUCTOS
            new EntityImportDescriptorDto
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
            new EntityImportDescriptorDto
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
            new EntityImportDescriptorDto
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
            new EntityImportDescriptorDto
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

    public IReadOnlyList<EntityImportDescriptorDto> GetAvailableEntities()
    {
        return _descriptors.AsReadOnly();
    }

    public EntityImportDescriptorDto? GetEntityDescriptor(string entityName)
    {
        return _descriptors.FirstOrDefault(d => d.EntityName.Equals(entityName, StringComparison.OrdinalIgnoreCase));
    }
}
