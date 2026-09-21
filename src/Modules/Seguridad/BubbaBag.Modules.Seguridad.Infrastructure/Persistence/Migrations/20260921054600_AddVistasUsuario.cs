using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVistasUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VistasUsuario",
                schema: "seguridad",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Entidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EsPredeterminada = table.Column<bool>(type: "boolean", nullable: false),
                    EsSistema = table.Column<bool>(type: "boolean", nullable: false),
                    ConfiguracionJson = table.Column<string>(type: "text", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VistasUsuario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VistasUsuario_AspNetUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalSchema: "seguridad",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VistasUsuario_UsuarioId_Entidad",
                schema: "seguridad",
                table: "VistasUsuario",
                columns: new[] { "UsuarioId", "Entidad" });

            migrationBuilder.CreateIndex(
                name: "IX_VistasUsuario_UsuarioId_Entidad_EsPredeterminada",
                schema: "seguridad",
                table: "VistasUsuario",
                columns: new[] { "UsuarioId", "Entidad", "EsPredeterminada" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VistasUsuario",
                schema: "seguridad");
        }
    }
}
