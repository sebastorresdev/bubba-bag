using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCodigoExternoATrabajo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoExterno",
                schema: "serviciocampo",
                table: "Trabajos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UnidadMedidaId",
                schema: "serviciocampo",
                table: "PlantillasMateriales",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasMateriales_UnidadMedidaId",
                schema: "serviciocampo",
                table: "PlantillasMateriales",
                column: "UnidadMedidaId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlantillasMateriales_UnidadesMedida_UnidadMedidaId",
                schema: "serviciocampo",
                table: "PlantillasMateriales",
                column: "UnidadMedidaId",
                principalSchema: "inventario",
                principalTable: "UnidadesMedida",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlantillasMateriales_UnidadesMedida_UnidadMedidaId",
                schema: "serviciocampo",
                table: "PlantillasMateriales");

            migrationBuilder.DropIndex(
                name: "IX_PlantillasMateriales_UnidadMedidaId",
                schema: "serviciocampo",
                table: "PlantillasMateriales");

            migrationBuilder.DropColumn(
                name: "CodigoExterno",
                schema: "serviciocampo",
                table: "Trabajos");

            migrationBuilder.DropColumn(
                name: "UnidadMedidaId",
                schema: "serviciocampo",
                table: "PlantillasMateriales");
        }
    }
}
