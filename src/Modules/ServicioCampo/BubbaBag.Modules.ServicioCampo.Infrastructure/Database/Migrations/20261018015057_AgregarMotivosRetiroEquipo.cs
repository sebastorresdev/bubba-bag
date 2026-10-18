using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarMotivosRetiroEquipo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS serviciocampo.\"FallasEquipo\";");

            migrationBuilder.CreateTable(
                name: "MotivosRetiroEquipo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    TipoRetiro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivosRetiroEquipo", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MotivosRetiroEquipo_Nombre",
                schema: "serviciocampo",
                table: "MotivosRetiroEquipo",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_MotivosRetiroEquipo_TipoRetiro",
                schema: "serviciocampo",
                table: "MotivosRetiroEquipo",
                column: "TipoRetiro");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MotivosRetiroEquipo",
                schema: "serviciocampo");
        }
    }
}
