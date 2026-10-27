using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class InicialServicioCampo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "inventario");

            migrationBuilder.EnsureSchema(
                name: "serviciocampo");

            migrationBuilder.EnsureSchema(
                name: "crm");

            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "Almacenes",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    UnidadOrganizativaId = table.Column<Guid>(type: "uuid", nullable: true),
                    AlmacenPadreId = table.Column<Guid>(type: "uuid", nullable: true),
                    RecursoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreadoPorId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreadoPorNombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ActualizadoPorId = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Almacenes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Almacenes_Almacenes_AlmacenPadreId",
                        column: x => x.AlmacenPadreId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CategoriasProducto",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CategoriaPadreId = table.Column<Guid>(type: "uuid", nullable: true),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriasProducto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoriasProducto_CategoriasProducto_CategoriaPadreId",
                        column: x => x.CategoriaPadreId,
                        principalSchema: "inventario",
                        principalTable: "CategoriasProducto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracionEmpresa",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RazonSocial = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    NombreComercial = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Ruc = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DireccionFiscal = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    LogoBase64 = table.Column<string>(type: "text", nullable: true),
                    PiePaginaDocumentos = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionEmpresa", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GruposUnidadMedida",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Observacion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EstaActivo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaModificacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GruposUnidadMedida", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ListasPrecios",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Moneda = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "PEN"),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListasPrecios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MotivosIncidencia",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Ambito = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivosIncidencia", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MotivosRetiroEquipo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    TipoRetiro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivosRetiroEquipo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ResolucionDiferenciaTransferencias",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OperacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferenciaDetalleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadAfectada = table.Column<decimal>(type: "numeric(18,5)", precision: 18, scale: 5, nullable: false),
                    Resultado = table.Column<int>(type: "integer", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    EvidenciaDocumentaria = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SupervisorId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupervisorNombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaResolucion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResolucionDiferenciaTransferencias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tareas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    DuracionEstimadaMinutos = table.Column<int>(type: "integer", nullable: false, defaultValue: 15),
                    RequiereEvidenciaFotografica = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tareas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ubigeos",
                schema: "crm",
                columns: table => new
                {
                    Codigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Departamento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Provincia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Distrito = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CapitalLegal = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CodigoRegionNatural = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RegionNatural = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ubigeos", x => x.Codigo);
                });

            migrationBuilder.CreateTable(
                name: "UnidadesOrganizativas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Ciudad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EsSedePrincipal = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnidadesOrganizativas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZonasOperativas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DescripcionProveedor = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    SucursalId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenPredeterminadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZonasOperativas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Compras",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Proveedor = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    NumeroDocumento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaDocumento = table.Column<DateOnly>(type: "date", nullable: false),
                    Moneda = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: true),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Observacion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LineasJson = table.Column<string>(type: "text", nullable: false),
                    Total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioRecepcionId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaRecepcion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DocumentoRespaldoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Compras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Compras_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UbicacionesInventario",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    EsPrincipal = table.Column<bool>(type: "boolean", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false),
                    TipoUbicacion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    UbicacionPadreId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UbicacionesInventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UbicacionesInventario_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UbicacionesInventario_UbicacionesInventario_UbicacionPadreId",
                        column: x => x.UbicacionPadreId,
                        principalSchema: "inventario",
                        principalTable: "UbicacionesInventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioAlmacenAutorizaciones",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: false),
                    PuedeConsultar = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    PuedeDespachar = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    PuedeRecepcionar = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    EsSupervisor = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioAlmacenAutorizaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuarioAlmacenAutorizaciones_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnidadesMedida",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GrupoUnidadMedidaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EsUnidadBase = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    UnidadMedidaBaseId = table.Column<Guid>(type: "uuid", nullable: true),
                    Cantidad = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false, defaultValue: 1m),
                    FactorConversionTotal = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false, defaultValue: 1m),
                    EstaActivo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnidadesMedida", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnidadesMedida_GruposUnidadMedida_GrupoUnidadMedidaId",
                        column: x => x.GrupoUnidadMedidaId,
                        principalSchema: "inventario",
                        principalTable: "GruposUnidadMedida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UnidadesMedida_UnidadesMedida_UnidadMedidaBaseId",
                        column: x => x.UnidadMedidaBaseId,
                        principalSchema: "inventario",
                        principalTable: "UnidadesMedida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TiposOrdenTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    RequiereVisitaCampo = table.Column<bool>(type: "boolean", nullable: false),
                    ExigeFirmaCliente = table.Column<bool>(type: "boolean", nullable: false),
                    ExigeEvidenciasFotograficas = table.Column<bool>(type: "boolean", nullable: false),
                    ColorHex = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "#0f6cbd"),
                    ListaPreciosId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposOrdenTrabajo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TiposOrdenTrabajo_ListasPrecios_ListaPreciosId",
                        column: x => x.ListaPreciosId,
                        principalSchema: "inventario",
                        principalTable: "ListasPrecios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Recursos",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NombreCompleto = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    DocumentoIdentidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    UnidadOrganizativaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ZonaOperativaId = table.Column<Guid>(type: "uuid", nullable: true),
                    AlmacenBaseId = table.Column<Guid>(type: "uuid", nullable: true),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    EmpleadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    CapacidadMaximaOrdenesPorDia = table.Column<int>(type: "integer", nullable: false, defaultValue: 6),
                    ColorHex = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true, defaultValue: "#0078d4"),
                    Notas = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recursos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Recursos_ZonasOperativas_ZonaOperativaId",
                        column: x => x.ZonaOperativaId,
                        principalSchema: "serviciocampo",
                        principalTable: "ZonasOperativas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AjustesInventario",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NumeroAprobacion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: false),
                    UbicacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    DocumentoReferencia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalItems = table.Column<int>(type: "integer", nullable: false),
                    TotalCantidad = table.Column<decimal>(type: "numeric(19,5)", precision: 19, scale: 5, nullable: false),
                    ValorTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    LineasJson = table.Column<string>(type: "text", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioRegistro = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioAprobacion = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    FechaAprobacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AjustesInventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AjustesInventario_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AjustesInventario_UbicacionesInventario_UbicacionId",
                        column: x => x.UbicacionId,
                        principalSchema: "inventario",
                        principalTable: "UbicacionesInventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DevolucionesProveedor",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Proveedor = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: false),
                    UbicacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    TipoDocumento = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    NumeroDocumento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaDocumento = table.Column<DateOnly>(type: "date", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DocumentoRespaldoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LineasJson = table.Column<string>(type: "text", nullable: false),
                    TotalItems = table.Column<int>(type: "integer", nullable: false),
                    TotalCantidad = table.Column<decimal>(type: "numeric(18,5)", precision: 18, scale: 5, nullable: false),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioNombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaCompletada = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DevolucionesProveedor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DevolucionesProveedor_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DevolucionesProveedor_UbicacionesInventario_UbicacionId",
                        column: x => x.UbicacionId,
                        principalSchema: "inventario",
                        principalTable: "UbicacionesInventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Transferencias",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UbicacionOrigenId = table.Column<Guid>(type: "uuid", nullable: true),
                    UbicacionDestinoId = table.Column<Guid>(type: "uuid", nullable: true),
                    OperacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreadoPorId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreadoPorNombre = table.Column<string>(type: "text", nullable: true),
                    Numero = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AlmacenOrigenId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenDestinoId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadOrganizativaOrigenId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadOrganizativaDestinoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Modalidad = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    FechaDespacho = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaCierre = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DespachadoPorId = table.Column<Guid>(type: "uuid", nullable: true),
                    DespachadoPorNombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    NumeroGuiaRemision = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transferencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transferencias_Almacenes_AlmacenDestinoId",
                        column: x => x.AlmacenDestinoId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Transferencias_Almacenes_AlmacenOrigenId",
                        column: x => x.AlmacenOrigenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Transferencias_UbicacionesInventario_UbicacionDestinoId",
                        column: x => x.UbicacionDestinoId,
                        principalSchema: "inventario",
                        principalTable: "UbicacionesInventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Transferencias_UbicacionesInventario_UbicacionOrigenId",
                        column: x => x.UbicacionOrigenId,
                        principalSchema: "inventario",
                        principalTable: "UbicacionesInventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    PrecioBase = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    ListaPreciosPredeterminadaId = table.Column<Guid>(type: "uuid", nullable: true),
                    CategoriaProductoId = table.Column<Guid>(type: "uuid", nullable: true),
                    GrupoUnidadMedidaId = table.Column<Guid>(type: "uuid", nullable: true),
                    UnidadMedidaDefectoId = table.Column<Guid>(type: "uuid", nullable: true),
                    DecimalesCantidad = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    EsSerializado = table.Column<bool>(type: "boolean", nullable: false),
                    CodigoBarras = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Notas = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CostoActual = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    CostoEstandar = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    AfectoImpuesto = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ProveedorDefecto = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.Id);
                    table.CheckConstraint("CK_Productos_DecimalesCantidad", "\"DecimalesCantidad\" BETWEEN 0 AND 5");
                    table.ForeignKey(
                        name: "FK_Productos_CategoriasProducto_CategoriaProductoId",
                        column: x => x.CategoriaProductoId,
                        principalSchema: "inventario",
                        principalTable: "CategoriasProducto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_GruposUnidadMedida_GrupoUnidadMedidaId",
                        column: x => x.GrupoUnidadMedidaId,
                        principalSchema: "inventario",
                        principalTable: "GruposUnidadMedida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productos_ListasPrecios_ListaPreciosPredeterminadaId",
                        column: x => x.ListaPreciosPredeterminadaId,
                        principalSchema: "inventario",
                        principalTable: "ListasPrecios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Productos_UnidadesMedida_UnidadMedidaDefectoId",
                        column: x => x.UnidadMedidaDefectoId,
                        principalSchema: "inventario",
                        principalTable: "UnidadesMedida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CamposDefinicion",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoOrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Clave = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Etiqueta = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TipoDato = table.Column<int>(type: "integer", nullable: false),
                    OpcionesJson = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EsObligatorio = table.Column<bool>(type: "boolean", nullable: false),
                    OrdenVisual = table.Column<int>(type: "integer", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CamposDefinicion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CamposDefinicion_TiposOrdenTrabajo_TipoOrdenTrabajoId",
                        column: x => x.TipoOrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposOrdenTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecepcionesTransferencia",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OperacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NumeroRecepcion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TransferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaRecepcion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    RecibidoPorId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecibidoPorNombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecepcionesTransferencia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecepcionesTransferencia_Transferencias_TransferenciaId",
                        column: x => x.TransferenciaId,
                        principalSchema: "inventario",
                        principalTable: "Transferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TransferenciaDetalles",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Condicion = table.Column<int>(type: "integer", nullable: false),
                    UnidadMedidaId = table.Column<Guid>(type: "uuid", nullable: true),
                    UnidadMedidaNombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadEnviada = table.Column<decimal>(type: "numeric(18,5)", precision: 18, scale: 5, nullable: false),
                    CantidadRecibida = table.Column<decimal>(type: "numeric(18,5)", precision: 18, scale: 5, nullable: false, defaultValue: 0m),
                    CantidadResuelta = table.Column<decimal>(type: "numeric(18,5)", precision: 18, scale: 5, nullable: false, defaultValue: 0m),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransferenciaDetalles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransferenciaDetalles_Transferencias_TransferenciaId",
                        column: x => x.TransferenciaId,
                        principalSchema: "inventario",
                        principalTable: "Transferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ElementosListaPrecios",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ListaPreciosId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadMedidaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Monto = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    MetodoFijacion = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElementosListaPrecios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ElementosListaPrecios_ListasPrecios_ListaPreciosId",
                        column: x => x.ListaPreciosId,
                        principalSchema: "inventario",
                        principalTable: "ListasPrecios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ElementosListaPrecios_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ElementosListaPrecios_UnidadesMedida_UnidadMedidaId",
                        column: x => x.UnidadMedidaId,
                        principalSchema: "inventario",
                        principalTable: "UnidadesMedida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ItemsSeriados",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroSerie = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NumeroSmartCard = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MacAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UbicacionActualId = table.Column<Guid>(type: "uuid", nullable: true),
                    TransferenciaEnTransitoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Condicion = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    ClienteActualId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrdenTrabajoInstalacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaInstalacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemsSeriados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemsSeriados_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemsSeriados_Transferencias_TransferenciaEnTransitoId",
                        column: x => x.TransferenciaEnTransitoId,
                        principalSchema: "inventario",
                        principalTable: "Transferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemsSeriados_UbicacionesInventario_UbicacionActualId",
                        column: x => x.UbicacionActualId,
                        principalSchema: "inventario",
                        principalTable: "UbicacionesInventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlantillasTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    DuracionEstimadaMinutos = table.Column<int>(type: "integer", nullable: false, defaultValue: 60),
                    SlaHorasResolucion = table.Column<int>(type: "integer", nullable: true),
                    EsPredeterminada = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantillasTrabajo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlantillasTrabajo_Productos_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StocksAlmacen",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UbicacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Condicion = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadDisponible = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false),
                    CantidadReservada = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StocksAlmacen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StocksAlmacen_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StocksAlmacen_UbicacionesInventario_UbicacionId",
                        column: x => x.UbicacionId,
                        principalSchema: "inventario",
                        principalTable: "UbicacionesInventario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecepcionTransferenciaDetalles",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecepcionTransferenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferenciaDetalleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadAceptada = table.Column<decimal>(type: "numeric(18,5)", precision: 18, scale: 5, nullable: false),
                    SeriesAceptadasJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecepcionTransferenciaDetalles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecepcionTransferenciaDetalles_RecepcionesTransferencia_Rec~",
                        column: x => x.RecepcionTransferenciaId,
                        principalSchema: "inventario",
                        principalTable: "RecepcionesTransferencia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MovimientosInventario",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UbicacionOrigenId = table.Column<Guid>(type: "uuid", nullable: true),
                    UbicacionDestinoId = table.Column<Guid>(type: "uuid", nullable: true),
                    TransferenciaId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventoId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Condicion = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false),
                    ItemSeriadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    AlmacenOrigenId = table.Column<Guid>(type: "uuid", nullable: true),
                    AlmacenDestinoId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: true),
                    NumeroDocumento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UsuarioResponsableId = table.Column<Guid>(type: "uuid", nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaMovimiento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientosInventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_Almacenes_AlmacenDestinoId",
                        column: x => x.AlmacenDestinoId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_Almacenes_AlmacenOrigenId",
                        column: x => x.AlmacenOrigenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_ItemsSeriados_ItemSeriadoId",
                        column: x => x.ItemSeriadoId,
                        principalSchema: "inventario",
                        principalTable: "ItemsSeriados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlantillasMateriales",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlantillaTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadPrevista = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false),
                    EsObligatorio = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Observaciones = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    UnidadMedidaId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantillasMateriales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlantillasMateriales_PlantillasTrabajo_PlantillaTrabajoId",
                        column: x => x.PlantillaTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "PlantillasTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlantillasMateriales_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlantillasMateriales_UnidadesMedida_UnidadMedidaId",
                        column: x => x.UnidadMedidaId,
                        principalSchema: "inventario",
                        principalTable: "UnidadesMedida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlantillasTareas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlantillaTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TareaId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenSecuencia = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    EsObligatoria = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    RequiereEvidencia = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Instrucciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantillasTareas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlantillasTareas_PlantillasTrabajo_PlantillaTrabajoId",
                        column: x => x.PlantillaTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "PlantillasTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlantillasTareas_Tareas_TareaId",
                        column: x => x.TareaId,
                        principalSchema: "serviciocampo",
                        principalTable: "Tareas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TransferenciaDetalleSeries",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferenciaDetalleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemSeriadoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroSerie = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RecepcionDetalleId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolucionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Recibida = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    TieneIncidencia = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    MotivoIncidencia = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransferenciaDetalleSeries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransferenciaDetalleSeries_RecepcionTransferenciaDetalles_R~",
                        column: x => x.RecepcionDetalleId,
                        principalSchema: "inventario",
                        principalTable: "RecepcionTransferenciaDetalles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TransferenciaDetalleSeries_ResolucionDiferenciaTransferenci~",
                        column: x => x.ResolucionId,
                        principalSchema: "inventario",
                        principalTable: "ResolucionDiferenciaTransferencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TransferenciaDetalleSeries_TransferenciaDetalles_Transferen~",
                        column: x => x.TransferenciaDetalleId,
                        principalSchema: "inventario",
                        principalTable: "TransferenciaDetalles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "clientes",
                schema: "crm",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoCliente = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TipoPersona = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "NATURAL"),
                    TipoDocumento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "DNI"),
                    DocumentoIdentidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nombres = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Apellidos = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    RazonSocial = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TelefonoPrincipal = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TelefonoSecundario = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ContactoPrincipalId = table.Column<Guid>(type: "uuid", nullable: true),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    UbigeoCodigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ReferenciaUbicacion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    CoordenadaLat = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    CoordenadaLng = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    EsClienteFacturacion = table.Column<bool>(type: "boolean", nullable: false),
                    EsClienteServicio = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_clientes_ubigeos_UbigeoCodigo",
                        column: x => x.UbigeoCodigo,
                        principalSchema: "crm",
                        principalTable: "ubigeos",
                        principalColumn: "Codigo",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "contactos",
                schema: "crm",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombres = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Apellidos = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Cargo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CuentaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    TelefonoMovil = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TelefonoTrabajo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    UbigeoCodigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contactos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_contactos_clientes_CuentaId",
                        column: x => x.CuentaId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_contactos_ubigeos_UbigeoCodigo",
                        column: x => x.UbigeoCodigo,
                        principalSchema: "crm",
                        principalTable: "ubigeos",
                        principalColumn: "Codigo",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrdenesTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoWo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ListaPreciosId = table.Column<Guid>(type: "uuid", nullable: true),
                    Moneda = table.Column<string>(type: "text", nullable: false),
                    TipoOrdenId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreadoPorId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadOrganizativaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ZonaOperativaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClienteFacturacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroOrden = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ReferenciaExterna = table.Column<string>(type: "text", nullable: true),
                    CodigoContrato = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NumeroPedido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    EstadoSistema = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    EstadoOrigen = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MotivoCierreId = table.Column<Guid>(type: "uuid", nullable: true),
                    ObservacionesCierre = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    NoConsumioMateriales = table.Column<bool>(type: "boolean", nullable: false),
                    DescargaMaterialesOmitida = table.Column<bool>(type: "boolean", nullable: false),
                    MotivoOmisionMateriales = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    DescargaMaterialesObligatoria = table.Column<bool>(type: "boolean", nullable: false),
                    DescargaMaterialesConfirmada = table.Column<bool>(type: "boolean", nullable: false),
                    FechaDescargaMateriales = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ContadorOmisionDescarga = table.Column<int>(type: "integer", nullable: false),
                    ObservacionesGenerales = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenesTrabajo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_MotivosIncidencia_MotivoCierreId",
                        column: x => x.MotivoCierreId,
                        principalSchema: "serviciocampo",
                        principalTable: "MotivosIncidencia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_TiposOrdenTrabajo_TipoOrdenId",
                        column: x => x.TipoOrdenId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposOrdenTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_UnidadesOrganizativas_UnidadOrganizativaId",
                        column: x => x.UnidadOrganizativaId,
                        principalSchema: "serviciocampo",
                        principalTable: "UnidadesOrganizativas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_ZonasOperativas_ZonaOperativaId",
                        column: x => x.ZonaOperativaId,
                        principalSchema: "serviciocampo",
                        principalTable: "ZonasOperativas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_clientes_ClienteFacturacionId",
                        column: x => x.ClienteFacturacionId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_clientes_ClienteServicioId",
                        column: x => x.ClienteServicioId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TiposTareaServicio",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoTarea = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ClienteFacturacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    DuracionEstimadaMinutos = table.Column<int>(type: "integer", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposTareaServicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TiposTareaServicio_clientes_ClienteFacturacionId",
                        column: x => x.ClienteFacturacionId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LiquidacionesMaterial",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroLiquidacion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResponsableId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaLiquidacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Borrador"),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiquidacionesMaterial", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiquidacionesMaterial_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LiquidacionesMaterial_OrdenesTrabajo_OrdenTrabajoId",
                        column: x => x.OrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenesTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrdenTrabajoVisitas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoVisita = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    NumeroVisita = table.Column<int>(type: "integer", nullable: false),
                    NumeroVisitaOrigen = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NumeroCita = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RecursoId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaProgramada = table.Column<DateOnly>(type: "date", nullable: false),
                    BloqueHorario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InicioAgendado = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinAgendado = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FechaSalidaEnCamino = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaInicioReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaFinReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaSincronizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FirmaClienteUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FirmadoPor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NombreFirmante = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    DniFirmante = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    EvidenciasConfirmadas = table.Column<bool>(type: "boolean", nullable: false),
                    MotivoCancelacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ObservacionesCancelacion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ObservacionesTecnico = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenTrabajoVisitas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoVisitas_MotivosIncidencia_MotivoCancelacionId",
                        column: x => x.MotivoCancelacionId,
                        principalSchema: "serviciocampo",
                        principalTable: "MotivosIncidencia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoVisitas_OrdenesTrabajo_OrdenTrabajoId",
                        column: x => x.OrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenesTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoVisitas_Recursos_RecursoId",
                        column: x => x.RecursoId,
                        principalSchema: "serviciocampo",
                        principalTable: "Recursos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Trabajos",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoTrabajo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CodigoExterno = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlantillaTrabajoId = table.Column<Guid>(type: "uuid", nullable: true),
                    ItemNumero = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    TarifaBaseCongelada = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReferenciaEquipo = table.Column<string>(type: "text", nullable: true),
                    OrigenPrecio = table.Column<string>(type: "text", nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trabajos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trabajos_OrdenesTrabajo_OrdenTrabajoId",
                        column: x => x.OrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenesTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Trabajos_PlantillasTrabajo_PlantillaTrabajoId",
                        column: x => x.PlantillaTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "PlantillasTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Trabajos_Productos_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrdenTrabajoTareas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoTarea = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TipoTareaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroWoIbs = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ItemNumero = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    EstadoTarea = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TarifaBaseCongelada = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    EsElegibleBonoIndicador = table.Column<bool>(type: "boolean", nullable: false),
                    NombreReglaAplicada = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    MontoBonoFinal = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0.00m),
                    MontoPenalizacion = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0.00m),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ObservacionesCierre = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MotivoRechazoId = table.Column<Guid>(type: "uuid", nullable: true),
                    ObservacionesRechazo = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenTrabajoTareas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoTareas_MotivosIncidencia_MotivoRechazoId",
                        column: x => x.MotivoRechazoId,
                        principalSchema: "serviciocampo",
                        principalTable: "MotivosIncidencia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoTareas_OrdenesTrabajo_OrdenTrabajoId",
                        column: x => x.OrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenesTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoTareas_TiposTareaServicio_TipoTareaId",
                        column: x => x.TipoTareaId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposTareaServicio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LiquidacionesMaterialItems",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LiquidacionMaterialId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadConsumida = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false, defaultValue: 0m),
                    CantidadDevuelta = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false, defaultValue: 0m),
                    EsSeriado = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ItemSeriadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    NumeroSerie = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EsRetiro = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiquidacionesMaterialItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiquidacionesMaterialItems_LiquidacionesMaterial_Liquidacio~",
                        column: x => x.LiquidacionMaterialId,
                        principalSchema: "serviciocampo",
                        principalTable: "LiquidacionesMaterial",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LiquidacionesMaterialItems_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrdenTrabajoMateriales",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoVisitaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false),
                    ItemSeriadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    NumeroSerie = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NumeroSmartCard = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EsRetiro = table.Column<bool>(type: "boolean", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenTrabajoMateriales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoMateriales_OrdenTrabajoVisitas_OrdenTrabajoVisi~",
                        column: x => x.OrdenTrabajoVisitaId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenTrabajoVisitas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoMateriales_OrdenesTrabajo_OrdenTrabajoId",
                        column: x => x.OrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenesTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrdenTrabajoVisitaEvidencias",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoVisitaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    EsObligatoria = table.Column<bool>(type: "boolean", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CoordenadasGps = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenTrabajoVisitaEvidencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoVisitaEvidencias_OrdenTrabajoVisitas_OrdenTraba~",
                        column: x => x.OrdenTrabajoVisitaId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenTrabajoVisitas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaterialesTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadMedidaId = table.Column<Guid>(type: "uuid", nullable: true),
                    UnidadMedidaNombre = table.Column<string>(type: "text", nullable: true),
                    EsObligatorio = table.Column<bool>(type: "boolean", nullable: false),
                    CantidadPrevista = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false, defaultValue: 0m),
                    CantidadUtilizada = table.Column<decimal>(type: "numeric(14,5)", precision: 14, scale: 5, nullable: false, defaultValue: 0m),
                    EsSeriado = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ItemSeriadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    NumeroSerie = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NumeroSmartCard = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EsRetiro = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialesTrabajo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialesTrabajo_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaterialesTrabajo_Trabajos_TrabajoId",
                        column: x => x.TrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "Trabajos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TareasTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TareaId = table.Column<Guid>(type: "uuid", nullable: true),
                    PlantillaTareaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Instrucciones = table.Column<string>(type: "text", nullable: true),
                    NombreTarea = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    OrdenSecuencia = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    EsObligatoria = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    RequiereEvidencia = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EvidenciaUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ObservacionesTecnico = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TareasTrabajo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TareasTrabajo_Tareas_TareaId",
                        column: x => x.TareaId,
                        principalSchema: "serviciocampo",
                        principalTable: "Tareas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TareasTrabajo_Trabajos_TrabajoId",
                        column: x => x.TrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "Trabajos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AjustesInventario_AlmacenId",
                schema: "inventario",
                table: "AjustesInventario",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_AjustesInventario_Numero",
                schema: "inventario",
                table: "AjustesInventario",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AjustesInventario_UbicacionId",
                schema: "inventario",
                table: "AjustesInventario",
                column: "UbicacionId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_ActualizadoPorId",
                schema: "inventario",
                table: "Almacenes",
                column: "ActualizadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_AlmacenPadreId",
                schema: "inventario",
                table: "Almacenes",
                column: "AlmacenPadreId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_Codigo",
                schema: "inventario",
                table: "Almacenes",
                column: "Codigo");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_CreadoPorId",
                schema: "inventario",
                table: "Almacenes",
                column: "CreadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_RecursoId",
                schema: "inventario",
                table: "Almacenes",
                column: "RecursoId",
                unique: true,
                filter: "\"Tipo\" = 2 AND \"Activo\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_Tipo",
                schema: "inventario",
                table: "Almacenes",
                column: "Tipo");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_UnidadOrganizativaId",
                schema: "inventario",
                table: "Almacenes",
                column: "UnidadOrganizativaId");

            migrationBuilder.CreateIndex(
                name: "IX_CamposDefinicion_TipoOrdenTrabajoId_Clave",
                schema: "serviciocampo",
                table: "CamposDefinicion",
                columns: new[] { "TipoOrdenTrabajoId", "Clave" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CategoriasProducto_CategoriaPadreId",
                schema: "inventario",
                table: "CategoriasProducto",
                column: "CategoriaPadreId");

            migrationBuilder.CreateIndex(
                name: "IX_clientes_CodigoCliente",
                schema: "crm",
                table: "clientes",
                column: "CodigoCliente",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_clientes_ContactoPrincipalId",
                schema: "crm",
                table: "clientes",
                column: "ContactoPrincipalId");

            migrationBuilder.CreateIndex(
                name: "IX_clientes_DocumentoIdentidad",
                schema: "crm",
                table: "clientes",
                column: "DocumentoIdentidad");

            migrationBuilder.CreateIndex(
                name: "IX_clientes_UbigeoCodigo",
                schema: "crm",
                table: "clientes",
                column: "UbigeoCodigo");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_AlmacenId",
                schema: "inventario",
                table: "Compras",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_Proveedor_TipoDocumento_NumeroDocumento",
                schema: "inventario",
                table: "Compras",
                columns: new[] { "Proveedor", "TipoDocumento", "NumeroDocumento" },
                unique: true,
                filter: "\"NumeroDocumento\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_contactos_CuentaId",
                schema: "crm",
                table: "contactos",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_contactos_UbigeoCodigo",
                schema: "crm",
                table: "contactos",
                column: "UbigeoCodigo");

            migrationBuilder.CreateIndex(
                name: "IX_DevolucionesProveedor_AlmacenId",
                schema: "inventario",
                table: "DevolucionesProveedor",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_DevolucionesProveedor_Estado",
                schema: "inventario",
                table: "DevolucionesProveedor",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_DevolucionesProveedor_FechaRegistro",
                schema: "inventario",
                table: "DevolucionesProveedor",
                column: "FechaRegistro");

            migrationBuilder.CreateIndex(
                name: "IX_DevolucionesProveedor_Numero",
                schema: "inventario",
                table: "DevolucionesProveedor",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DevolucionesProveedor_UbicacionId",
                schema: "inventario",
                table: "DevolucionesProveedor",
                column: "UbicacionId");

            migrationBuilder.CreateIndex(
                name: "IX_ElementosListaPrecios_ListaPreciosId_ProductoId_UnidadMedid~",
                schema: "inventario",
                table: "ElementosListaPrecios",
                columns: new[] { "ListaPreciosId", "ProductoId", "UnidadMedidaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ElementosListaPrecios_ProductoId",
                schema: "inventario",
                table: "ElementosListaPrecios",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_ElementosListaPrecios_UnidadMedidaId",
                schema: "inventario",
                table: "ElementosListaPrecios",
                column: "UnidadMedidaId");

            migrationBuilder.CreateIndex(
                name: "IX_GruposUnidadMedida_Nombre",
                schema: "inventario",
                table: "GruposUnidadMedida",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_ClienteActualId",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "ClienteActualId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_Estado",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_MacAddress",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "MacAddress");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_NumeroSerie",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "NumeroSerie",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_NumeroSmartCard",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "NumeroSmartCard");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_OrdenTrabajoInstalacionId",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "OrdenTrabajoInstalacionId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_ProductoId",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_TransferenciaEnTransitoId",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "TransferenciaEnTransitoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_UbicacionActualId",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "UbicacionActualId");

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesMaterial_AlmacenId",
                schema: "serviciocampo",
                table: "LiquidacionesMaterial",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesMaterial_NumeroLiquidacion",
                schema: "serviciocampo",
                table: "LiquidacionesMaterial",
                column: "NumeroLiquidacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesMaterial_OrdenTrabajoId",
                schema: "serviciocampo",
                table: "LiquidacionesMaterial",
                column: "OrdenTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesMaterialItems_LiquidacionMaterialId",
                schema: "serviciocampo",
                table: "LiquidacionesMaterialItems",
                column: "LiquidacionMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesMaterialItems_NumeroSerie",
                schema: "serviciocampo",
                table: "LiquidacionesMaterialItems",
                column: "NumeroSerie");

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesMaterialItems_ProductoId",
                schema: "serviciocampo",
                table: "LiquidacionesMaterialItems",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialesTrabajo_NumeroSerie",
                schema: "serviciocampo",
                table: "MaterialesTrabajo",
                column: "NumeroSerie");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialesTrabajo_ProductoId",
                schema: "serviciocampo",
                table: "MaterialesTrabajo",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialesTrabajo_TrabajoId",
                schema: "serviciocampo",
                table: "MaterialesTrabajo",
                column: "TrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_MotivosIncidencia_Ambito",
                schema: "serviciocampo",
                table: "MotivosIncidencia",
                column: "Ambito");

            migrationBuilder.CreateIndex(
                name: "IX_MotivosIncidencia_Codigo",
                schema: "serviciocampo",
                table: "MotivosIncidencia",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MotivosRetiroEquipo_Nombre",
                schema: "serviciocampo",
                table: "MotivosRetiroEquipo",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_MotivosRetiroEquipo_TipoRetiro",
                schema: "serviciocampo",
                table: "MotivosRetiroEquipo",
                column: "TipoRetiro");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_AlmacenDestinoId",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "AlmacenDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_AlmacenOrigenId",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "AlmacenOrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_ClienteId",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_FechaMovimiento",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "FechaMovimiento");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_ItemSeriadoId",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "ItemSeriadoId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_NumeroDocumento",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "NumeroDocumento");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_OrdenTrabajoId",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "OrdenTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_ProductoId",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_Tipo",
                schema: "inventario",
                table: "MovimientosInventario",
                column: "Tipo");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_ClienteFacturacionId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "ClienteFacturacionId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_ClienteServicioId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "ClienteServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_CodigoContrato",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "CodigoContrato");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_CodigoWo",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "CodigoWo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_Estado",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_EstadoSistema",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "EstadoSistema");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_MotivoCierreId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "MotivoCierreId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_NumeroOrden",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "NumeroOrden");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_TipoOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "TipoOrdenId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "UnidadOrganizativaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_ZonaOperativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "ZonaOperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoMateriales_FechaRegistro",
                schema: "serviciocampo",
                table: "OrdenTrabajoMateriales",
                column: "FechaRegistro");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoMateriales_ItemSeriadoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoMateriales",
                column: "ItemSeriadoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoMateriales_NumeroSerie",
                schema: "serviciocampo",
                table: "OrdenTrabajoMateriales",
                column: "NumeroSerie");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoMateriales_NumeroSmartCard",
                schema: "serviciocampo",
                table: "OrdenTrabajoMateriales",
                column: "NumeroSmartCard");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoMateriales_OrdenTrabajoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoMateriales",
                column: "OrdenTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoMateriales_OrdenTrabajoVisitaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoMateriales",
                column: "OrdenTrabajoVisitaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_CodigoTarea",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "CodigoTarea",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_MotivoRechazoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "MotivoRechazoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_NumeroWoIbs",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "NumeroWoIbs");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_OrdenTrabajoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "OrdenTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_TipoTareaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "TipoTareaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitaEvidencias_OrdenTrabajoVisitaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitaEvidencias",
                column: "OrdenTrabajoVisitaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_CodigoVisita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "CodigoVisita",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_Estado",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_FechaProgramada",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "FechaProgramada");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_MotivoCancelacionId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "MotivoCancelacionId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroCita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "NumeroCita");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroVisitaOrigen",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "NumeroVisitaOrigen");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_OrdenTrabajoId_NumeroVisita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                columns: new[] { "OrdenTrabajoId", "NumeroVisita" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_RecursoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "RecursoId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasMateriales_PlantillaTrabajoId",
                schema: "serviciocampo",
                table: "PlantillasMateriales",
                column: "PlantillaTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasMateriales_ProductoId",
                schema: "serviciocampo",
                table: "PlantillasMateriales",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasMateriales_UnidadMedidaId",
                schema: "serviciocampo",
                table: "PlantillasMateriales",
                column: "UnidadMedidaId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasTareas_PlantillaTrabajoId",
                schema: "serviciocampo",
                table: "PlantillasTareas",
                column: "PlantillaTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasTareas_TareaId",
                schema: "serviciocampo",
                table: "PlantillasTareas",
                column: "TareaId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasTrabajo_ServicioId",
                schema: "serviciocampo",
                table: "PlantillasTrabajo",
                column: "ServicioId",
                unique: true,
                filter: "\"Activo\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_CategoriaProductoId",
                schema: "inventario",
                table: "Productos",
                column: "CategoriaProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_Codigo",
                schema: "inventario",
                table: "Productos",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Productos_GrupoUnidadMedidaId",
                schema: "inventario",
                table: "Productos",
                column: "GrupoUnidadMedidaId");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_ListaPreciosPredeterminadaId",
                schema: "inventario",
                table: "Productos",
                column: "ListaPreciosPredeterminadaId");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_UnidadMedidaDefectoId",
                schema: "inventario",
                table: "Productos",
                column: "UnidadMedidaDefectoId");

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionesTransferencia_FechaRecepcion",
                schema: "inventario",
                table: "RecepcionesTransferencia",
                column: "FechaRecepcion");

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionesTransferencia_NumeroRecepcion",
                schema: "inventario",
                table: "RecepcionesTransferencia",
                column: "NumeroRecepcion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionesTransferencia_OperacionId",
                schema: "inventario",
                table: "RecepcionesTransferencia",
                column: "OperacionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionesTransferencia_TransferenciaId",
                schema: "inventario",
                table: "RecepcionesTransferencia",
                column: "TransferenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionTransferenciaDetalles_ProductoId",
                schema: "inventario",
                table: "RecepcionTransferenciaDetalles",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionTransferenciaDetalles_RecepcionTransferenciaId",
                schema: "inventario",
                table: "RecepcionTransferenciaDetalles",
                column: "RecepcionTransferenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_RecepcionTransferenciaDetalles_TransferenciaDetalleId",
                schema: "inventario",
                table: "RecepcionTransferenciaDetalles",
                column: "TransferenciaDetalleId");

            migrationBuilder.CreateIndex(
                name: "IX_Recursos_AlmacenBaseId",
                schema: "serviciocampo",
                table: "Recursos",
                column: "AlmacenBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Recursos_Codigo",
                schema: "serviciocampo",
                table: "Recursos",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Recursos_EmpleadoId",
                schema: "serviciocampo",
                table: "Recursos",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_Recursos_UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "Recursos",
                column: "UnidadOrganizativaId");

            migrationBuilder.CreateIndex(
                name: "IX_Recursos_UsuarioId",
                schema: "serviciocampo",
                table: "Recursos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Recursos_ZonaOperativaId",
                schema: "serviciocampo",
                table: "Recursos",
                column: "ZonaOperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_ResolucionDiferenciaTransferencias_FechaResolucion",
                schema: "inventario",
                table: "ResolucionDiferenciaTransferencias",
                column: "FechaResolucion");

            migrationBuilder.CreateIndex(
                name: "IX_ResolucionDiferenciaTransferencias_OperacionId",
                schema: "inventario",
                table: "ResolucionDiferenciaTransferencias",
                column: "OperacionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResolucionDiferenciaTransferencias_TransferenciaDetalleId",
                schema: "inventario",
                table: "ResolucionDiferenciaTransferencias",
                column: "TransferenciaDetalleId");

            migrationBuilder.CreateIndex(
                name: "IX_ResolucionDiferenciaTransferencias_TransferenciaId",
                schema: "inventario",
                table: "ResolucionDiferenciaTransferencias",
                column: "TransferenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_StocksAlmacen_ProductoId",
                schema: "inventario",
                table: "StocksAlmacen",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_StocksAlmacen_UbicacionId_ProductoId_Condicion",
                schema: "inventario",
                table: "StocksAlmacen",
                columns: new[] { "UbicacionId", "ProductoId", "Condicion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TareasTrabajo_TareaId",
                schema: "serviciocampo",
                table: "TareasTrabajo",
                column: "TareaId");

            migrationBuilder.CreateIndex(
                name: "IX_TareasTrabajo_TrabajoId",
                schema: "serviciocampo",
                table: "TareasTrabajo",
                column: "TrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_TiposOrdenTrabajo_ListaPreciosId",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                column: "ListaPreciosId");

            migrationBuilder.CreateIndex(
                name: "IX_TiposOrdenTrabajo_Nombre",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TiposTareaServicio_ClienteFacturacionId_CodigoTarea",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                columns: new[] { "ClienteFacturacionId", "CodigoTarea" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trabajos_OrdenTrabajoId_CodigoTrabajo",
                schema: "serviciocampo",
                table: "Trabajos",
                columns: new[] { "OrdenTrabajoId", "CodigoTrabajo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trabajos_PlantillaTrabajoId",
                schema: "serviciocampo",
                table: "Trabajos",
                column: "PlantillaTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_Trabajos_ServicioId",
                schema: "serviciocampo",
                table: "Trabajos",
                column: "ServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_TransferenciaDetalles_ProductoId",
                schema: "inventario",
                table: "TransferenciaDetalles",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_TransferenciaDetalles_TransferenciaId",
                schema: "inventario",
                table: "TransferenciaDetalles",
                column: "TransferenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_TransferenciaDetalleSeries_NumeroSerie",
                schema: "inventario",
                table: "TransferenciaDetalleSeries",
                column: "NumeroSerie");

            migrationBuilder.CreateIndex(
                name: "IX_TransferenciaDetalleSeries_RecepcionDetalleId",
                schema: "inventario",
                table: "TransferenciaDetalleSeries",
                column: "RecepcionDetalleId");

            migrationBuilder.CreateIndex(
                name: "IX_TransferenciaDetalleSeries_ResolucionId",
                schema: "inventario",
                table: "TransferenciaDetalleSeries",
                column: "ResolucionId");

            migrationBuilder.CreateIndex(
                name: "IX_TransferenciaDetalleSeries_TransferenciaDetalleId",
                schema: "inventario",
                table: "TransferenciaDetalleSeries",
                column: "TransferenciaDetalleId");

            migrationBuilder.CreateIndex(
                name: "IX_TransferenciaDetalleSeries_TransferenciaDetalleId_ItemSeria~",
                schema: "inventario",
                table: "TransferenciaDetalleSeries",
                columns: new[] { "TransferenciaDetalleId", "ItemSeriadoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_AlmacenDestinoId",
                schema: "inventario",
                table: "Transferencias",
                column: "AlmacenDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_AlmacenOrigenId",
                schema: "inventario",
                table: "Transferencias",
                column: "AlmacenOrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_Estado",
                schema: "inventario",
                table: "Transferencias",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_FechaRegistro",
                schema: "inventario",
                table: "Transferencias",
                column: "FechaRegistro");

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_Numero",
                schema: "inventario",
                table: "Transferencias",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_OperacionId",
                schema: "inventario",
                table: "Transferencias",
                column: "OperacionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_UbicacionDestinoId",
                schema: "inventario",
                table: "Transferencias",
                column: "UbicacionDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_Transferencias_UbicacionOrigenId",
                schema: "inventario",
                table: "Transferencias",
                column: "UbicacionOrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_UbicacionesInventario_AlmacenId",
                schema: "inventario",
                table: "UbicacionesInventario",
                column: "AlmacenId",
                unique: true,
                filter: "\"EsPrincipal\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_UbicacionesInventario_AlmacenId_Codigo",
                schema: "inventario",
                table: "UbicacionesInventario",
                columns: new[] { "AlmacenId", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UbicacionesInventario_AlmacenId_TipoUbicacion",
                schema: "inventario",
                table: "UbicacionesInventario",
                columns: new[] { "AlmacenId", "TipoUbicacion" });

            migrationBuilder.CreateIndex(
                name: "IX_UbicacionesInventario_UbicacionPadreId",
                schema: "inventario",
                table: "UbicacionesInventario",
                column: "UbicacionPadreId");

            migrationBuilder.CreateIndex(
                name: "IX_ubigeos_Departamento",
                schema: "crm",
                table: "ubigeos",
                column: "Departamento");

            migrationBuilder.CreateIndex(
                name: "IX_ubigeos_Departamento_Provincia",
                schema: "crm",
                table: "ubigeos",
                columns: new[] { "Departamento", "Provincia" });

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesMedida_GrupoUnidadMedidaId_EsUnidadBase",
                schema: "inventario",
                table: "UnidadesMedida",
                columns: new[] { "GrupoUnidadMedidaId", "EsUnidadBase" },
                unique: true,
                filter: "\"EsUnidadBase\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesMedida_GrupoUnidadMedidaId_Nombre",
                schema: "inventario",
                table: "UnidadesMedida",
                columns: new[] { "GrupoUnidadMedidaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesMedida_UnidadMedidaBaseId",
                schema: "inventario",
                table: "UnidadesMedida",
                column: "UnidadMedidaBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesOrganizativas_Codigo",
                schema: "serviciocampo",
                table: "UnidadesOrganizativas",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesOrganizativas_Nombre",
                schema: "serviciocampo",
                table: "UnidadesOrganizativas",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioAlmacenAutorizaciones_AlmacenId",
                schema: "inventario",
                table: "UsuarioAlmacenAutorizaciones",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioAlmacenAutorizaciones_UsuarioId_AlmacenId",
                schema: "inventario",
                table: "UsuarioAlmacenAutorizaciones",
                columns: new[] { "UsuarioId", "AlmacenId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ZonasOperativas_AlmacenPredeterminadoId",
                schema: "serviciocampo",
                table: "ZonasOperativas",
                column: "AlmacenPredeterminadoId");

            migrationBuilder.CreateIndex(
                name: "IX_ZonasOperativas_Codigo",
                schema: "serviciocampo",
                table: "ZonasOperativas",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ZonasOperativas_SucursalId",
                schema: "serviciocampo",
                table: "ZonasOperativas",
                column: "SucursalId");

            migrationBuilder.AddForeignKey(
                name: "FK_clientes_contactos_ContactoPrincipalId",
                schema: "crm",
                table: "clientes",
                column: "ContactoPrincipalId",
                principalSchema: "crm",
                principalTable: "contactos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_clientes_contactos_ContactoPrincipalId",
                schema: "crm",
                table: "clientes");

            migrationBuilder.DropTable(
                name: "AjustesInventario",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "CamposDefinicion",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Compras",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "ConfiguracionEmpresa",
                schema: "public");

            migrationBuilder.DropTable(
                name: "DevolucionesProveedor",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "ElementosListaPrecios",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "LiquidacionesMaterialItems",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "MaterialesTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "MotivosRetiroEquipo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "MovimientosInventario",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "OrdenTrabajoMateriales",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "OrdenTrabajoTareas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "OrdenTrabajoVisitaEvidencias",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "PlantillasMateriales",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "PlantillasTareas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "StocksAlmacen",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "TareasTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TransferenciaDetalleSeries",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "UsuarioAlmacenAutorizaciones",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "LiquidacionesMaterial",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "ItemsSeriados",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "TiposTareaServicio",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "OrdenTrabajoVisitas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Tareas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Trabajos",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "RecepcionTransferenciaDetalles",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "ResolucionDiferenciaTransferencias",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "TransferenciaDetalles",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "Recursos",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "OrdenesTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "PlantillasTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "RecepcionesTransferencia",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "MotivosIncidencia",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TiposOrdenTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "UnidadesOrganizativas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "ZonasOperativas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Productos",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "Transferencias",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "CategoriasProducto",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "ListasPrecios",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "UnidadesMedida",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "UbicacionesInventario",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "GruposUnidadMedida",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "Almacenes",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "contactos",
                schema: "crm");

            migrationBuilder.DropTable(
                name: "clientes",
                schema: "crm");

            migrationBuilder.DropTable(
                name: "ubigeos",
                schema: "crm");
        }
    }
}
