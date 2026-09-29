using System;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260928130000_SimplificarEntidadAlmacen")]
public partial class SimplificarEntidadAlmacen : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP INDEX IF EXISTS inventario.\"IX_Almacenes_Codigo\";");
        migrationBuilder.Sql("DROP INDEX IF EXISTS inventario.\"IX_Almacenes_RecursoTecnicoId\";");
        migrationBuilder.Sql("DROP INDEX IF EXISTS inventario.\"IX_Almacenes_SucursalId\";");

        migrationBuilder.DropColumn("Codigo", "Almacenes", "inventario");
        migrationBuilder.DropColumn("Direccion", "Almacenes", "inventario");
        migrationBuilder.DropColumn("RecursoTecnicoId", "Almacenes", "inventario");
        migrationBuilder.DropColumn("SucursalId", "Almacenes", "inventario");
        migrationBuilder.DropColumn("Telefono", "Almacenes", "inventario");
        migrationBuilder.DropColumn("Tipo", "Almacenes", "inventario");

        migrationBuilder.AddColumn<string>(
            name: "Descripcion",
            schema: "inventario",
            table: "Almacenes",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "CreadoPorId",
            schema: "inventario",
            table: "Almacenes",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "CreatedAt",
            schema: "inventario",
            table: "Almacenes",
            type: "timestamp with time zone",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");

        migrationBuilder.AddColumn<Guid>(
            name: "ActualizadoPorId",
            schema: "inventario",
            table: "Almacenes",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "UpdatedAt",
            schema: "inventario",
            table: "Almacenes",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Almacenes_CreadoPorId",
            schema: "inventario",
            table: "Almacenes",
            column: "CreadoPorId");

        migrationBuilder.CreateIndex(
            name: "IX_Almacenes_ActualizadoPorId",
            schema: "inventario",
            table: "Almacenes",
            column: "ActualizadoPorId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex("IX_Almacenes_CreadoPorId", "Almacenes", "inventario");
        migrationBuilder.DropIndex("IX_Almacenes_ActualizadoPorId", "Almacenes", "inventario");
        migrationBuilder.DropColumn("Descripcion", "Almacenes", "inventario");
        migrationBuilder.DropColumn("CreadoPorId", "Almacenes", "inventario");
        migrationBuilder.DropColumn("CreatedAt", "Almacenes", "inventario");
        migrationBuilder.DropColumn("ActualizadoPorId", "Almacenes", "inventario");
        migrationBuilder.DropColumn("UpdatedAt", "Almacenes", "inventario");

        migrationBuilder.AddColumn<string>(
            name: "Codigo",
            schema: "inventario",
            table: "Almacenes",
            type: "character varying(50)",
            maxLength: 50,
            nullable: true);
        migrationBuilder.Sql("UPDATE inventario.\"Almacenes\" SET \"Codigo\" = 'ALM-' || replace(\"Id\"::text, '-', '')");
        migrationBuilder.AlterColumn<string>(
            name: "Codigo",
            schema: "inventario",
            table: "Almacenes",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(50)",
            oldMaxLength: 50,
            oldNullable: true);

        migrationBuilder.AddColumn<string>(name: "Direccion", schema: "inventario", table: "Almacenes", type: "character varying(250)", maxLength: 250, nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "RecursoTecnicoId", schema: "inventario", table: "Almacenes", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "SucursalId", schema: "inventario", table: "Almacenes", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<string>(name: "Telefono", schema: "inventario", table: "Almacenes", type: "character varying(50)", maxLength: 50, nullable: true);
        migrationBuilder.AddColumn<int>(name: "Tipo", schema: "inventario", table: "Almacenes", type: "integer", nullable: false, defaultValue: 1);

        migrationBuilder.CreateIndex("IX_Almacenes_Codigo", "Almacenes", "Codigo", schema: "inventario", unique: true);
        migrationBuilder.CreateIndex("IX_Almacenes_RecursoTecnicoId", "Almacenes", "RecursoTecnicoId", schema: "inventario");
        migrationBuilder.CreateIndex("IX_Almacenes_SucursalId", "Almacenes", "SucursalId", schema: "inventario");
    }
}
