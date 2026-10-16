using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarUnidadOrganizativaAOrdenTrabajo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "UnidadOrganizativaId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenesTrabajo_UnidadesOrganizativas_UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "UnidadOrganizativaId",
                principalSchema: "serviciocampo",
                principalTable: "UnidadesOrganizativas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql(@"UPDATE serviciocampo.""OrdenesTrabajo"" o
                SET ""UnidadOrganizativaId"" = z.""SucursalId""
                FROM serviciocampo.""ZonasOperativas"" z
                WHERE o.""ZonaOperativaId"" = z.""Id"" AND o.""UnidadOrganizativaId"" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrdenesTrabajo_UnidadesOrganizativas_UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "UnidadOrganizativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");
        }
    }
}
