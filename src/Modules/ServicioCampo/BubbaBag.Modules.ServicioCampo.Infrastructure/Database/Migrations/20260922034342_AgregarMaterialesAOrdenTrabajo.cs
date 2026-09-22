using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarMaterialesAOrdenTrabajo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrdenTrabajoMateriales",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoVisitaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrdenTrabajoMateriales",
                schema: "serviciocampo");
        }
    }
}
