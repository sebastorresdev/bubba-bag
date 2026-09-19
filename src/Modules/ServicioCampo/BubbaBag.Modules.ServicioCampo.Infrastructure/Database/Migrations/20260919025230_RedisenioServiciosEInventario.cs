using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class RedisenioServiciosEInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TiposOrdenTrabajo_Codigo",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo");

            migrationBuilder.DropColumn(
                name: "Codigo",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo");

            migrationBuilder.AlterColumn<bool>(
                name: "ExigeFirmaCliente",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<bool>(
                name: "ExigeEvidenciasFotograficas",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

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
                name: "CatalogosServicio",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ContratanteId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogosServicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogosServicio_clientes_ContratanteId",
                        column: x => x.ContratanteId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Servicios",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    CatalogoServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    DuracionEstimadaMinutos = table.Column<int>(type: "integer", nullable: false),
                    CodigoExterno = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servicios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Servicios_CatalogosServicio_CatalogoServicioId",
                        column: x => x.CatalogoServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "CatalogosServicio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ServicioMateriales",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadTeorica = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
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
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroPaso = table.Column<int>(type: "integer", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    RequiereFoto = table.Column<bool>(type: "boolean", nullable: false),
                    TipoEvidencia = table.Column<int>(type: "integer", nullable: false),
                    EsObligatorio = table.Column<bool>(type: "boolean", nullable: false)
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
                    SucursalId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Habilitado = table.Column<bool>(type: "boolean", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_TiposOrdenTrabajo_Nombre",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CamposDefinicion_TipoOrdenTrabajoId_Clave",
                schema: "serviciocampo",
                table: "CamposDefinicion",
                columns: new[] { "TipoOrdenTrabajoId", "Clave" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CatalogosServicio_ContratanteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                column: "ContratanteId");

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
                name: "IX_Servicios_CatalogoServicioId",
                schema: "serviciocampo",
                table: "Servicios",
                column: "CatalogoServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_Servicios_Codigo",
                schema: "serviciocampo",
                table: "Servicios",
                column: "Codigo",
                unique: true);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CamposDefinicion",
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
                name: "Servicios",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "CatalogosServicio",
                schema: "serviciocampo");

            migrationBuilder.DropIndex(
                name: "IX_TiposOrdenTrabajo_Nombre",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo");

            migrationBuilder.AlterColumn<bool>(
                name: "ExigeFirmaCliente",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<bool>(
                name: "ExigeEvidenciasFotograficas",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddColumn<string>(
                name: "Codigo",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TiposOrdenTrabajo_Codigo",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                column: "Codigo",
                unique: true);
        }
    }
}
