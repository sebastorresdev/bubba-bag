using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260930010000_CatalogosPredeterminados")]
public partial class CatalogosPredeterminados : Migration
{
    private const string UnidadPredeterminada = "a1111111-1111-1111-1111-111111111111";
    private const string CategoriaPredeterminada = "d1111111-1111-1111-1111-111111111111";

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($$"""
            UPDATE inventario."GruposUnidadMedida"
            SET "Nombre" = 'Unidades generales', "FechaModificacion" = NOW()
            WHERE "Id" = '{{UnidadPredeterminada}}';

            UPDATE inventario."UnidadesMedida"
            SET "Nombre" = 'Unidad'
            WHERE "Id" = '{{UnidadPredeterminada}}';

            INSERT INTO inventario."CategoriasProducto"
                ("Id", "Nombre", "CategoriaPadreId", "Descripcion", "Activo")
            SELECT '{{CategoriaPredeterminada}}', 'Default', NULL,
                   'Categoría predeterminada para productos sin clasificación específica.', TRUE
            WHERE NOT EXISTS (
                SELECT 1 FROM inventario."CategoriasProducto"
                WHERE LOWER(TRIM("Nombre")) = 'default');

            UPDATE inventario."Productos"
            SET "CategoriaProductoId" = (
                SELECT "Id" FROM inventario."CategoriasProducto"
                WHERE LOWER(TRIM("Nombre")) = 'default'
                ORDER BY CASE WHEN "Id" = '{{CategoriaPredeterminada}}' THEN 0 ELSE 1 END
                LIMIT 1)
            WHERE "CategoriaProductoId" IS NULL;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($$"""
            UPDATE inventario."Productos"
            SET "CategoriaProductoId" = NULL
            WHERE "CategoriaProductoId" = '{{CategoriaPredeterminada}}';

            DELETE FROM inventario."CategoriasProducto"
            WHERE "Id" = '{{CategoriaPredeterminada}}';

            UPDATE inventario."GruposUnidadMedida"
            SET "Nombre" = 'Única unidad', "FechaModificacion" = NOW()
            WHERE "Id" = '{{UnidadPredeterminada}}';

            UPDATE inventario."UnidadesMedida"
            SET "Nombre" = 'Única unidad'
            WHERE "Id" = '{{UnidadPredeterminada}}';
            """);
    }
}
