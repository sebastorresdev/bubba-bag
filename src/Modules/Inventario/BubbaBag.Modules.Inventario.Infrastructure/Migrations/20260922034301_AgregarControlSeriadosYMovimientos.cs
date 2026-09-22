using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.Inventario.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarControlSeriadosYMovimientos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    AlmacenActualId = table.Column<Guid>(type: "uuid", nullable: true),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    ClienteActualId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrdenTrabajoInstalacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaInstalacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemsSeriados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemsSeriados_Almacenes_AlmacenActualId",
                        column: x => x.AlmacenActualId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ItemsSeriados_Productos_ProductoId",
                        column: x => x.ProductoId,
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
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CantidadDisponible = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    CantidadReservada = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StocksAlmacen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StocksAlmacen_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalSchema: "inventario",
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StocksAlmacen_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalSchema: "inventario",
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovimientosInventario",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
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

            migrationBuilder.CreateIndex(
                name: "IX_ItemsSeriados_AlmacenActualId",
                schema: "inventario",
                table: "ItemsSeriados",
                column: "AlmacenActualId");

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
                name: "IX_StocksAlmacen_AlmacenId_ProductoId",
                schema: "inventario",
                table: "StocksAlmacen",
                columns: new[] { "AlmacenId", "ProductoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StocksAlmacen_ProductoId",
                schema: "inventario",
                table: "StocksAlmacen",
                column: "ProductoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimientosInventario",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "StocksAlmacen",
                schema: "inventario");

            migrationBuilder.DropTable(
                name: "ItemsSeriados",
                schema: "inventario");
        }
    }
}
