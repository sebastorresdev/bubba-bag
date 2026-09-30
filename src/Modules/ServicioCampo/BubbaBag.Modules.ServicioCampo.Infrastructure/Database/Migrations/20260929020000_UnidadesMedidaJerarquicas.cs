using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260929020000_UnidadesMedidaJerarquicas")]
public partial class UnidadesMedidaJerarquicas : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Observacion",
            schema: "inventario",
            table: "GruposUnidadMedida",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.RenameColumn(
            name: "FactorConversion",
            schema: "inventario",
            table: "UnidadesMedida",
            newName: "Cantidad");

        migrationBuilder.AddColumn<decimal>(
            name: "FactorConversionTotal",
            schema: "inventario",
            table: "UnidadesMedida",
            type: "numeric(18,4)",
            precision: 18,
            scale: 4,
            nullable: false,
            defaultValue: 1m);

        migrationBuilder.Sql("""
            WITH RECURSIVE factores AS (
                SELECT u."Id", 1::numeric(18,4) AS "FactorTotal"
                FROM inventario."UnidadesMedida" u
                WHERE u."EsUnidadBase" = TRUE

                UNION ALL

                SELECT hija."Id",
                       (hija."Cantidad" * padre."FactorTotal")::numeric(18,4)
                FROM inventario."UnidadesMedida" hija
                INNER JOIN factores padre ON padre."Id" = hija."UnidadMedidaBaseId"
            )
            UPDATE inventario."UnidadesMedida" u
            SET "FactorConversionTotal" = f."FactorTotal"
            FROM factores f
            WHERE u."Id" = f."Id";
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Observacion",
            schema: "inventario",
            table: "GruposUnidadMedida");

        migrationBuilder.DropColumn(
            name: "FactorConversionTotal",
            schema: "inventario",
            table: "UnidadesMedida");

        migrationBuilder.RenameColumn(
            name: "Cantidad",
            schema: "inventario",
            table: "UnidadesMedida",
            newName: "FactorConversion");
    }
}
