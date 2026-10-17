using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarAlmacenPadreAAlmacenes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AlmacenPadreId",
                schema: "inventario",
                table: "Almacenes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_AlmacenPadreId",
                schema: "inventario",
                table: "Almacenes",
                column: "AlmacenPadreId");

            migrationBuilder.AddForeignKey(
                name: "FK_Almacenes_Almacenes_AlmacenPadreId",
                schema: "inventario",
                table: "Almacenes",
                column: "AlmacenPadreId",
                principalSchema: "inventario",
                principalTable: "Almacenes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 1. Vincular custodias existentes usando el AlmacenBaseId de su Recurso
            migrationBuilder.Sql(@"
                UPDATE inventario.""Almacenes"" a
                SET ""AlmacenPadreId"" = r.""AlmacenBaseId""
                FROM serviciocampo.""Recursos"" r
                WHERE a.""RecursoId"" = r.""Id"" 
                  AND a.""Tipo"" = 2 
                  AND r.""AlmacenBaseId"" IS NOT NULL
                  AND a.""AlmacenPadreId"" IS NULL;
            ");

            // 2. Si no tenía AlmacenBaseId en el recurso, vincular a la bodega activa de la misma unidad organizativa
            migrationBuilder.Sql(@"
                UPDATE inventario.""Almacenes"" a
                SET ""AlmacenPadreId"" = (
                    SELECT b.""Id"" FROM inventario.""Almacenes"" b 
                    WHERE b.""Tipo"" = 1 
                      AND b.""UnidadOrganizativaId"" = a.""UnidadOrganizativaId"" 
                      AND b.""Activo"" = true 
                    ORDER BY b.""CreatedAt"" ASC 
                    LIMIT 1
                )
                WHERE a.""Tipo"" = 2 
                  AND a.""AlmacenPadreId"" IS NULL 
                  AND a.""UnidadOrganizativaId"" IS NOT NULL;
            ");

            // 3. Sincronizar el AlmacenBaseId del recurso con el AlmacenPadreId si estaba vacío
            migrationBuilder.Sql(@"
                UPDATE serviciocampo.""Recursos"" r
                SET ""AlmacenBaseId"" = a.""AlmacenPadreId""
                FROM inventario.""Almacenes"" a
                WHERE a.""RecursoId"" = r.""Id"" 
                  AND a.""Tipo"" = 2 
                  AND a.""AlmacenPadreId"" IS NOT NULL 
                  AND r.""AlmacenBaseId"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Almacenes_Almacenes_AlmacenPadreId",
                schema: "inventario",
                table: "Almacenes");

            migrationBuilder.DropIndex(
                name: "IX_Almacenes_AlmacenPadreId",
                schema: "inventario",
                table: "Almacenes");

            migrationBuilder.DropColumn(
                name: "AlmacenPadreId",
                schema: "inventario",
                table: "Almacenes");
        }
    }
}
