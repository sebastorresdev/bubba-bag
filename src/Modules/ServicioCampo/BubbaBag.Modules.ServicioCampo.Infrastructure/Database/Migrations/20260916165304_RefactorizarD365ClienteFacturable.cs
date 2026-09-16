using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class RefactorizarD365ClienteFacturable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrdenesTrabajo_OrigenesOrden_OrigenOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropTable(
                name: "OrigenesOrden",
                schema: "serviciocampo");

            migrationBuilder.DropIndex(
                name: "IX_TiposTareaServicio_CodigoTarea",
                schema: "serviciocampo",
                table: "TiposTareaServicio");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_OrigenOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "Categoria",
                schema: "serviciocampo",
                table: "TiposTareaServicio");

            migrationBuilder.DropColumn(
                name: "EsTareaSiebel",
                schema: "serviciocampo",
                table: "TiposTareaServicio");

            migrationBuilder.DropColumn(
                name: "OrigenOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.AddColumn<Guid>(
                name: "ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_TiposTareaServicio_ClienteFacturacionId_CodigoTarea",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                columns: new[] { "ClienteFacturacionId", "CodigoTarea" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TiposTareaServicio_clientes_ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                column: "ClienteFacturacionId",
                principalSchema: "crm",
                principalTable: "clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TiposTareaServicio_clientes_ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TiposTareaServicio");

            migrationBuilder.DropIndex(
                name: "IX_TiposTareaServicio_ClienteFacturacionId_CodigoTarea",
                schema: "serviciocampo",
                table: "TiposTareaServicio");

            migrationBuilder.DropColumn(
                name: "ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TiposTareaServicio");

            migrationBuilder.AddColumn<string>(
                name: "Categoria",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "EsTareaSiebel",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "OrigenOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "OrigenesOrden",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    EsIntegracionExterna = table.Column<bool>(type: "boolean", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrigenesOrden", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TiposTareaServicio_CodigoTarea",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                column: "CodigoTarea",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_OrigenOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "OrigenOrdenId");

            migrationBuilder.CreateIndex(
                name: "IX_OrigenesOrden_Codigo",
                schema: "serviciocampo",
                table: "OrigenesOrden",
                column: "Codigo",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenesTrabajo_OrigenesOrden_OrigenOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "OrigenOrdenId",
                principalSchema: "serviciocampo",
                principalTable: "OrigenesOrden",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
