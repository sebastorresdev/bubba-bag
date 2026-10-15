using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AutorImportacionAutenticado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreadoPorId",
                schema: "gestiondatos",
                table: "DataImportJobs",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DataImportJobs_CreadoPorId_TipoRegistro",
                schema: "gestiondatos",
                table: "DataImportJobs",
                columns: new[] { "CreadoPorId", "TipoRegistro" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DataImportJobs_CreadoPorId_TipoRegistro",
                schema: "gestiondatos",
                table: "DataImportJobs");

            migrationBuilder.DropColumn(
                name: "CreadoPorId",
                schema: "gestiondatos",
                table: "DataImportJobs");
        }
    }
}
