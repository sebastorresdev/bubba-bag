using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddModuloYNombreVisibleToRol : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Modulo",
                schema: "seguridad",
                table: "AspNetRoles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NombreVisible",
                schema: "seguridad",
                table: "AspNetRoles",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Modulo",
                schema: "seguridad",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "NombreVisible",
                schema: "seguridad",
                table: "AspNetRoles");
        }
    }
}
