using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class EliminarTarifarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrdenTrabajoTareas_TarifarioReglas_TarifarioReglaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropForeignKey(
                name: "FK_Servicios_CatalogosServicio_CatalogoServicioId",
                schema: "serviciocampo",
                table: "Servicios");

            migrationBuilder.DropTable(
                name: "CatalogosServicio",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "ServicioMateriales",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "ServicioPasos",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "SucursalesServicio",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TarifarioReglas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TarifasServicio",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Tarifarios",
                schema: "serviciocampo");

            migrationBuilder.DropIndex(
                name: "IX_Servicios_CatalogoServicioId",
                schema: "serviciocampo",
                table: "Servicios");

            migrationBuilder.DropIndex(
                name: "IX_OrdenTrabajoTareas_TarifarioReglaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropColumn(
                name: "CatalogoServicioId",
                schema: "serviciocampo",
                table: "Servicios");

            migrationBuilder.DropColumn(
                name: "TarifarioReglaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.RenameColumn(
                name: "ProductoComercialId",
                schema: "serviciocampo",
                table: "Servicios",
                newName: "ProductoId");

            migrationBuilder.AlterColumn<int>(
                name: "DuracionEstimadaMinutos",
                schema: "serviciocampo",
                table: "Servicios",
                type: "integer",
                nullable: false,
                defaultValue: 60,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<bool>(
                name: "Activo",
                schema: "serviciocampo",
                table: "Servicios",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ProductoId",
                schema: "serviciocampo",
                table: "Servicios",
                newName: "ProductoComercialId");

            migrationBuilder.AlterColumn<int>(
                name: "DuracionEstimadaMinutos",
                schema: "serviciocampo",
                table: "Servicios",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 60);

            migrationBuilder.AlterColumn<bool>(
                name: "Activo",
                schema: "serviciocampo",
                table: "Servicios",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CatalogoServicioId",
                schema: "serviciocampo",
                table: "Servicios",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TarifarioReglaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CatalogosServicio",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogosServicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogosServicio_clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ServicioMateriales",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadTeorica = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadMedida = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServicioMateriales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServicioMateriales_Servicios_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "Servicios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ServicioPasos",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    EsObligatorio = table.Column<bool>(type: "boolean", nullable: false),
                    NumeroPaso = table.Column<int>(type: "integer", nullable: false),
                    RequiereFoto = table.Column<bool>(type: "boolean", nullable: false),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoEvidencia = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServicioPasos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServicioPasos_Servicios_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "Servicios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SucursalesServicio",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Habilitado = table.Column<bool>(type: "boolean", nullable: false),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    SucursalId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SucursalesServicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SucursalesServicio_Servicios_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "Servicios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tarifarios",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteFacturacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaVigenciaDesde = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaVigenciaHasta = table.Column<DateOnly>(type: "date", nullable: true),
                    Moneda = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false, defaultValue: "PEN"),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tarifarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tarifarios_clientes_ClienteFacturacionId",
                        column: x => x.ClienteFacturacionId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TarifasServicio",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteFacturacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    TipoTareaServicioId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    AplicaGarantia = table.Column<bool>(type: "boolean", nullable: false),
                    AplicaPago = table.Column<bool>(type: "boolean", nullable: false),
                    CodigoServicio = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DetalleServicio = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EmpresaContratante = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FijoAdicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    FijoBase = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador1_Adicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador1_CycleTime = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador2_Adicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador2_Agenda = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador3_Adicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador3_Sin30 = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MontoTotalTeorico = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Puntos = table.Column<int>(type: "integer", nullable: false),
                    Sucursal = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Tipificacion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    VariableAdicionalTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    VariableTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarifasServicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarifasServicio_TiposTareaServicio_TipoTareaServicioId",
                        column: x => x.TipoTareaServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposTareaServicio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TarifasServicio_clientes_ClienteFacturacionId",
                        column: x => x.ClienteFacturacionId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TarifarioReglas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TarifarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoTareaServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    AplicaBonoIndicador = table.Column<bool>(type: "boolean", nullable: false),
                    MontoTarifaBase = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    NombreRegla = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Prioridad = table.Column<int>(type: "integer", nullable: false, defaultValue: 10)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarifarioReglas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarifarioReglas_Tarifarios_TarifarioId",
                        column: x => x.TarifarioId,
                        principalSchema: "serviciocampo",
                        principalTable: "Tarifarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TarifarioReglas_TiposTareaServicio_TipoTareaServicioId",
                        column: x => x.TipoTareaServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposTareaServicio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Servicios_CatalogoServicioId",
                schema: "serviciocampo",
                table: "Servicios",
                column: "CatalogoServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_TarifarioReglaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "TarifarioReglaId");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogosServicio_ClienteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogosServicio_Nombre",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_ServicioMateriales_ServicioId_ProductoId",
                schema: "serviciocampo",
                table: "ServicioMateriales",
                columns: new[] { "ServicioId", "ProductoId" });

            migrationBuilder.CreateIndex(
                name: "IX_ServicioPasos_ServicioId_NumeroPaso",
                schema: "serviciocampo",
                table: "ServicioPasos",
                columns: new[] { "ServicioId", "NumeroPaso" });

            migrationBuilder.CreateIndex(
                name: "IX_SucursalesServicio_ServicioId",
                schema: "serviciocampo",
                table: "SucursalesServicio",
                column: "ServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_SucursalesServicio_SucursalId_ServicioId",
                schema: "serviciocampo",
                table: "SucursalesServicio",
                columns: new[] { "SucursalId", "ServicioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TarifarioReglas_TarifarioId",
                schema: "serviciocampo",
                table: "TarifarioReglas",
                column: "TarifarioId");

            migrationBuilder.CreateIndex(
                name: "IX_TarifarioReglas_TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifarioReglas",
                column: "TipoTareaServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_Tarifarios_ClienteFacturacionId_FechaVigenciaDesde_FechaVig~",
                schema: "serviciocampo",
                table: "Tarifarios",
                columns: new[] { "ClienteFacturacionId", "FechaVigenciaDesde", "FechaVigenciaHasta" });

            migrationBuilder.CreateIndex(
                name: "IX_Tarifarios_Codigo",
                schema: "serviciocampo",
                table: "Tarifarios",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TarifasServicio_ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TarifasServicio",
                column: "ClienteFacturacionId");

            migrationBuilder.CreateIndex(
                name: "IX_TarifasServicio_EmpresaContratante_CodigoServicio_Sucursal",
                schema: "serviciocampo",
                table: "TarifasServicio",
                columns: new[] { "EmpresaContratante", "CodigoServicio", "Sucursal" });

            migrationBuilder.CreateIndex(
                name: "IX_TarifasServicio_TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifasServicio",
                column: "TipoTareaServicioId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenTrabajoTareas_TarifarioReglas_TarifarioReglaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "TarifarioReglaId",
                principalSchema: "serviciocampo",
                principalTable: "TarifarioReglas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Servicios_CatalogosServicio_CatalogoServicioId",
                schema: "serviciocampo",
                table: "Servicios",
                column: "CatalogoServicioId",
                principalSchema: "serviciocampo",
                principalTable: "CatalogosServicio",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
