using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.Seguridad.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AgregarAlcanceOperativoUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UsuariosAlmacenes",
                schema: "seguridad",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenId = table.Column<Guid>(type: "uuid", nullable: false),
                    EsPrincipal = table.Column<bool>(type: "boolean", nullable: false),
                    FechaAsignacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosAlmacenes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuariosAlmacenes_AspNetUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalSchema: "seguridad",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuariosZonasOperativas",
                schema: "seguridad",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    ZonaOperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaAsignacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosZonasOperativas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuariosZonasOperativas_AspNetUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalSchema: "seguridad",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosAlmacenes_UsuarioId_AlmacenId",
                schema: "seguridad",
                table: "UsuariosAlmacenes",
                columns: new[] { "UsuarioId", "AlmacenId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosZonasOperativas_UsuarioId_ZonaOperativaId",
                schema: "seguridad",
                table: "UsuariosZonasOperativas",
                columns: new[] { "UsuarioId", "ZonaOperativaId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UsuariosAlmacenes",
                schema: "seguridad");

            migrationBuilder.DropTable(
                name: "UsuariosZonasOperativas",
                schema: "seguridad");
        }
    }
}
