using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarModeloTrabajosYLiquidaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "inventario");

            migrationBuilder.EnsureSchema(
                name: "crm");

            migrationBuilder.AddColumn<string>(
                name: "ReferenciaExterna",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventario' AND table_name = 'ItemsSeriados') THEN
        CREATE TABLE inventario.""ItemsSeriados"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""ProductoId"" uuid NOT NULL REFERENCES inventario.""Productos"" (""Id"") ON DELETE RESTRICT,
            ""NumeroSerie"" character varying(100) NOT NULL,
            ""NumeroSmartCard"" character varying(100),
            ""MacAddress"" character varying(50),
            ""AlmacenActualId"" uuid REFERENCES inventario.""Almacenes"" (""Id"") ON DELETE SET NULL,
            ""Estado"" integer NOT NULL,
            ""ClienteActualId"" uuid,
            ""OrdenTrabajoInstalacionId"" uuid,
            ""FechaInstalacion"" timestamp with time zone,
            ""Observaciones"" character varying(500),
            ""CreatedAt"" timestamp with time zone NOT NULL,
            ""UpdatedAt"" timestamp with time zone
        );
        CREATE INDEX IF NOT EXISTS ""IX_ItemsSeriados_AlmacenActualId"" ON inventario.""ItemsSeriados"" (""AlmacenActualId"");
        CREATE INDEX IF NOT EXISTS ""IX_ItemsSeriados_ClienteActualId"" ON inventario.""ItemsSeriados"" (""ClienteActualId"");
        CREATE INDEX IF NOT EXISTS ""IX_ItemsSeriados_Estado"" ON inventario.""ItemsSeriados"" (""Estado"");
        CREATE INDEX IF NOT EXISTS ""IX_ItemsSeriados_MacAddress"" ON inventario.""ItemsSeriados"" (""MacAddress"");
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ItemsSeriados_NumeroSerie"" ON inventario.""ItemsSeriados"" (""NumeroSerie"");
        CREATE INDEX IF NOT EXISTS ""IX_ItemsSeriados_NumeroSmartCard"" ON inventario.""ItemsSeriados"" (""NumeroSmartCard"");
        CREATE INDEX IF NOT EXISTS ""IX_ItemsSeriados_OrdenTrabajoInstalacionId"" ON inventario.""ItemsSeriados"" (""OrdenTrabajoInstalacionId"");
        CREATE INDEX IF NOT EXISTS ""IX_ItemsSeriados_ProductoId"" ON inventario.""ItemsSeriados"" (""ProductoId"");
    END IF;
END $$;");

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
                name: "PlantillasTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    DuracionEstimadaMinutos = table.Column<int>(type: "integer", nullable: false, defaultValue: 60),
                    EsPredeterminada = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantillasTrabajo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlantillasTrabajo_Servicios_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "Servicios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventario' AND table_name = 'StocksAlmacen') THEN
        CREATE TABLE inventario.""StocksAlmacen"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""AlmacenId"" uuid NOT NULL REFERENCES inventario.""Almacenes"" (""Id"") ON DELETE CASCADE,
            ""ProductoId"" uuid NOT NULL REFERENCES inventario.""Productos"" (""Id"") ON DELETE RESTRICT,
            ""CantidadDisponible"" numeric(14,2) NOT NULL DEFAULT 0,
            ""CantidadReservada"" numeric(14,2) NOT NULL DEFAULT 0,
            ""UpdatedAt"" timestamp with time zone NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_StocksAlmacen_AlmacenId_ProductoId"" ON inventario.""StocksAlmacen"" (""AlmacenId"", ""ProductoId"");
        CREATE INDEX IF NOT EXISTS ""IX_StocksAlmacen_ProductoId"" ON inventario.""StocksAlmacen"" (""ProductoId"");
    END IF;
END $$;");

            migrationBuilder.CreateTable(
                name: "Tareas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
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

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'crm' AND table_name = 'ubigeos') THEN
        CREATE TABLE crm.ubigeos (
            ""Codigo"" character varying(10) NOT NULL PRIMARY KEY,
            ""Departamento"" character varying(100) NOT NULL,
            ""Provincia"" character varying(100) NOT NULL,
            ""Distrito"" character varying(100) NOT NULL,
            ""CapitalLegal"" character varying(150),
            ""CodigoRegionNatural"" character varying(10),
            ""RegionNatural"" character varying(50)
        );
    END IF;
    CREATE INDEX IF NOT EXISTS ""IX_ubigeos_Departamento"" ON crm.ubigeos (""Departamento"");
    CREATE INDEX IF NOT EXISTS ""IX_ubigeos_Departamento_Provincia"" ON crm.ubigeos (""Departamento"", ""Provincia"");
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'crm' AND table_name = 'clientes' AND column_name = 'UbigeoCodigo') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_clientes_ubigeos_UbigeoCodigo') THEN
            ALTER TABLE crm.clientes ADD CONSTRAINT ""FK_clientes_ubigeos_UbigeoCodigo"" FOREIGN KEY (""UbigeoCodigo"") REFERENCES crm.ubigeos (""Codigo"") ON DELETE RESTRICT;
        END IF;
    END IF;
END $$;");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventario' AND table_name = 'MovimientosInventario') THEN
        CREATE TABLE inventario.""MovimientosInventario"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""Tipo"" integer NOT NULL,
            ""ProductoId"" uuid NOT NULL REFERENCES inventario.""Productos"" (""Id"") ON DELETE RESTRICT,
            ""Cantidad"" numeric(14,2) NOT NULL,
            ""ItemSeriadoId"" uuid REFERENCES inventario.""ItemsSeriados"" (""Id"") ON DELETE SET NULL,
            ""AlmacenOrigenId"" uuid REFERENCES inventario.""Almacenes"" (""Id"") ON DELETE RESTRICT,
            ""AlmacenDestinoId"" uuid REFERENCES inventario.""Almacenes"" (""Id"") ON DELETE RESTRICT,
            ""ClienteId"" uuid,
            ""OrdenTrabajoId"" uuid,
            ""NumeroDocumento"" character varying(100),
            ""UsuarioResponsableId"" uuid,
            ""Observaciones"" character varying(500),
            ""FechaMovimiento"" timestamp with time zone NOT NULL
        );
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_AlmacenDestinoId"" ON inventario.""MovimientosInventario"" (""AlmacenDestinoId"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_AlmacenOrigenId"" ON inventario.""MovimientosInventario"" (""AlmacenOrigenId"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_ClienteId"" ON inventario.""MovimientosInventario"" (""ClienteId"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_FechaMovimiento"" ON inventario.""MovimientosInventario"" (""FechaMovimiento"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_ItemSeriadoId"" ON inventario.""MovimientosInventario"" (""ItemSeriadoId"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_NumeroDocumento"" ON inventario.""MovimientosInventario"" (""NumeroDocumento"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_OrdenTrabajoId"" ON inventario.""MovimientosInventario"" (""OrdenTrabajoId"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_ProductoId"" ON inventario.""MovimientosInventario"" (""ProductoId"");
        CREATE INDEX IF NOT EXISTS ""IX_MovimientosInventario_Tipo"" ON inventario.""MovimientosInventario"" (""Tipo"");
    END IF;
END $$;");

            migrationBuilder.CreateTable(
                name: "LiquidacionesMaterialItems",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LiquidacionMaterialId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadConsumida = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    CantidadDevuelta = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
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
                name: "PlantillasMateriales",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlantillaTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadPrevista = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    EsObligatorio = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Observaciones = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true)
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
                });

            migrationBuilder.CreateTable(
                name: "Trabajos",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoTrabajo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlantillaTrabajoId = table.Column<Guid>(type: "uuid", nullable: true),
                    ItemNumero = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    TarifaBaseCongelada = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                        name: "FK_Trabajos_Servicios_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "Servicios",
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
                name: "MaterialesTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadPrevista = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    CantidadUtilizada = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
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
                name: "IX_PlantillasTrabajo_Codigo",
                schema: "serviciocampo",
                table: "PlantillasTrabajo",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasTrabajo_ServicioId",
                schema: "serviciocampo",
                table: "PlantillasTrabajo",
                column: "ServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_Tareas_Codigo",
                schema: "serviciocampo",
                table: "Tareas",
                column: "Codigo",
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LiquidacionesMaterialItems",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "MaterialesTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "PlantillasMateriales",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "PlantillasTareas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TareasTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "LiquidacionesMaterial",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Tareas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Trabajos",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "PlantillasTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropColumn(
                name: "ReferenciaExterna",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");
        }
    }
}
