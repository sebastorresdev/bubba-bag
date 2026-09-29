using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260928161500_QuitarCodigoListaPrecios")]
public class QuitarCodigoListaPrecios : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP INDEX IF EXISTS inventario.\"IX_ListasPrecios_Codigo\";");
        migrationBuilder.Sql("ALTER TABLE inventario.\"ListasPrecios\" DROP COLUMN IF EXISTS \"Codigo\";");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Codigo",
            schema: "inventario",
            table: "ListasPrecios",
            type: "character varying(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.Sql(
            "UPDATE inventario.\"ListasPrecios\" SET \"Codigo\" = 'LP-' || replace(\"Id\"::text, '-', '') WHERE \"Codigo\" IS NULL;");

        migrationBuilder.AlterColumn<string>(
            name: "Codigo",
            schema: "inventario",
            table: "ListasPrecios",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(50)",
            oldMaxLength: 50,
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_ListasPrecios_Codigo",
            schema: "inventario",
            table: "ListasPrecios",
            column: "Codigo",
            unique: true);
    }
}
