using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCodigosAutonomosVisitaYTarea : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoVisita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CodigoTarea",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_CodigoVisita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "CodigoVisita",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_CodigoTarea",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "CodigoTarea",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrdenTrabajoVisitas_CodigoVisita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropIndex(
                name: "IX_OrdenTrabajoTareas_CodigoTarea",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropColumn(
                name: "CodigoVisita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "CodigoTarea",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");
        }
    }
}
