using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class ReintentosImportacionInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EliminadoHistorial",
                schema: "gestiondatos",
                table: "DataImportJobs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "HuellaSolicitud",
                schema: "gestiondatos",
                table: "DataImportJobs",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EliminadoHistorial",
                schema: "gestiondatos",
                table: "DataImportJobs");

            migrationBuilder.DropColumn(
                name: "HuellaSolicitud",
                schema: "gestiondatos",
                table: "DataImportJobs");
        }
    }
}
