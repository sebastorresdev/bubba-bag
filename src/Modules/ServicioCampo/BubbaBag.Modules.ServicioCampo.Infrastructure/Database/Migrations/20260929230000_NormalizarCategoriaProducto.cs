using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260929230000_NormalizarCategoriaProducto")]
public partial class NormalizarCategoriaProducto : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "CategoriaProductoId",
            schema: "inventario",
            table: "Productos",
            type: "uuid",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE inventario."Productos" p
            SET "CategoriaProductoId" = c."Id"
            FROM inventario."CategoriasProducto" c
            WHERE p."Categoria" IS NOT NULL
              AND LOWER(TRIM(p."Categoria")) = LOWER(TRIM(c."Nombre"));
            """);

        migrationBuilder.CreateIndex(
            name: "IX_Productos_CategoriaProductoId",
            schema: "inventario",
            table: "Productos",
            column: "CategoriaProductoId");

        migrationBuilder.AddForeignKey(
            name: "FK_Productos_CategoriasProducto_CategoriaProductoId",
            schema: "inventario",
            table: "Productos",
            column: "CategoriaProductoId",
            principalSchema: "inventario",
            principalTable: "CategoriasProducto",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        migrationBuilder.DropColumn(
            name: "Categoria",
            schema: "inventario",
            table: "Productos");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Categoria",
            schema: "inventario",
            table: "Productos",
            type: "character varying(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE inventario."Productos" p
            SET "Categoria" = c."Nombre"
            FROM inventario."CategoriasProducto" c
            WHERE p."CategoriaProductoId" = c."Id";
            """);

        migrationBuilder.DropForeignKey(
            name: "FK_Productos_CategoriasProducto_CategoriaProductoId",
            schema: "inventario",
            table: "Productos");

        migrationBuilder.DropIndex(
            name: "IX_Productos_CategoriaProductoId",
            schema: "inventario",
            table: "Productos");

        migrationBuilder.DropColumn(
            name: "CategoriaProductoId",
            schema: "inventario",
            table: "Productos");
    }
}
