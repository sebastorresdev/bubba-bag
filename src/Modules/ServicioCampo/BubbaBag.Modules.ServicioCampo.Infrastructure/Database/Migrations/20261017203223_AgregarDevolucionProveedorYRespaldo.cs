using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDevolucionProveedorYRespaldo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DocumentoRespaldoUrl",
                schema: "inventario",
                table: "Compras",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DevolucionesProveedor",
                schema: "inventario");

            migrationBuilder.DropColumn(
                name: "DocumentoRespaldoUrl",
                schema: "inventario",
                table: "Compras");
        }
    }
}
