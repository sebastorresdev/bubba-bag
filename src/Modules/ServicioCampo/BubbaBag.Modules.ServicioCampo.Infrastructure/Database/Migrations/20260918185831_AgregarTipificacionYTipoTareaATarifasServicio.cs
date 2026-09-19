using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTipificacionYTipoTareaATarifasServicio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tipificacion",
                schema: "serviciocampo",
                table: "TarifasServicio",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifasServicio",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TarifasServicio_TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifasServicio",
                column: "TipoTareaServicioId");

            migrationBuilder.AddForeignKey(
                name: "FK_TarifasServicio_TiposTareaServicio_TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifasServicio",
                column: "TipoTareaServicioId",
                principalSchema: "serviciocampo",
                principalTable: "TiposTareaServicio",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TarifasServicio_TiposTareaServicio_TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifasServicio");

            migrationBuilder.DropIndex(
                name: "IX_TarifasServicio_TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifasServicio");

            migrationBuilder.DropColumn(
                name: "Tipificacion",
                schema: "serviciocampo",
                table: "TarifasServicio");

            migrationBuilder.DropColumn(
                name: "TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifasServicio");
        }
    }
}
