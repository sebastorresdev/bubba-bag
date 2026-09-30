using System;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

/// <summary>Introduce grupos y conversiones preservando los catálogos existentes.</summary>
[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260928210000_IntroducirGruposUnidadMedida")]
public partial class IntroducirGruposUnidadMedida : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "GruposUnidadMedida", schema: "inventario",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                EstaActivo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                FechaModificacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            }, constraints: table => table.PrimaryKey("PK_GruposUnidadMedida", x => x.Id));

        migrationBuilder.CreateIndex(name: "IX_GruposUnidadMedida_Nombre", schema: "inventario",
            table: "GruposUnidadMedida", column: "Nombre", unique: true);

        migrationBuilder.RenameColumn(name: "Activo", schema: "inventario", table: "UnidadesMedida", newName: "EstaActivo");

        // La FK se mantiene nullable solamente durante el backfill.
        migrationBuilder.AddColumn<Guid>(name: "GrupoUnidadMedidaId", schema: "inventario", table: "UnidadesMedida", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<bool>(name: "EsUnidadBase", schema: "inventario", table: "UnidadesMedida", type: "boolean", nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<Guid>(name: "UnidadMedidaBaseId", schema: "inventario", table: "UnidadesMedida", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<decimal>(name: "FactorConversion", schema: "inventario", table: "UnidadesMedida", type: "numeric(18,4)", nullable: false, defaultValue: 1m);
        migrationBuilder.AddColumn<Guid>(name: "GrupoUnidadMedidaId", schema: "inventario", table: "Productos", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "UnidadMedidaDefectoId", schema: "inventario", table: "Productos", type: "uuid", nullable: true);

        // Cada unidad histórica se transforma en la unidad base de un grupo propio. Se usa
        // el mismo UUID en tablas distintas para no depender de extensiones de PostgreSQL.
        migrationBuilder.Sql("""
            INSERT INTO inventario."GruposUnidadMedida"
                ("Id", "Nombre", "EstaActivo", "FechaCreacion")
            SELECT u."Id",
                   CASE WHEN COUNT(*) OVER (PARTITION BY LOWER(u."Nombre")) > 1
                        THEN LEFT(u."Nombre", 70) || ' (' || u."Codigo" || ')'
                        ELSE u."Nombre" END,
                   u."EstaActivo", NOW()
            FROM inventario."UnidadesMedida" u;

            UPDATE inventario."UnidadesMedida"
            SET "GrupoUnidadMedidaId" = "Id", "EsUnidadBase" = TRUE,
                "UnidadMedidaBaseId" = NULL, "FactorConversion" = 1;

            UPDATE inventario."Productos" p
            SET "GrupoUnidadMedidaId" = u."GrupoUnidadMedidaId",
                "UnidadMedidaDefectoId" = u."Id"
            FROM inventario."UnidadesMedida" u
            WHERE LOWER(TRIM(p."UnidadMedida")) IN
                (LOWER(TRIM(u."Codigo")), LOWER(TRIM(u."Nombre")), LOWER(TRIM(u."Abreviatura")));
            """);

        migrationBuilder.AlterColumn<Guid>(name: "GrupoUnidadMedidaId", schema: "inventario", table: "UnidadesMedida",
            type: "uuid", nullable: false, oldClrType: typeof(Guid), oldType: "uuid", oldNullable: true);
        migrationBuilder.DropColumn(name: "UnidadMedida", schema: "inventario", table: "Productos");
        migrationBuilder.DropIndex(name: "IX_UnidadesMedida_Codigo", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropColumn(name: "Codigo", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropColumn(name: "Abreviatura", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropColumn(name: "Descripcion", schema: "inventario", table: "UnidadesMedida");
        // Algunas bases fueron creadas antes de que PermiteDecimales quedara registrada
        // consistentemente en el historial. La columna ya no forma parte del modelo y su
        // eliminación debe ser tolerante a ambos estados.
        migrationBuilder.Sql("""
            ALTER TABLE inventario."UnidadesMedida"
            DROP COLUMN IF EXISTS "PermiteDecimales";
            """);

        migrationBuilder.CreateIndex(name: "IX_UnidadesMedida_GrupoUnidadMedidaId_Nombre", schema: "inventario", table: "UnidadesMedida",
            columns: new[] { "GrupoUnidadMedidaId", "Nombre" }, unique: true);
        migrationBuilder.CreateIndex(name: "IX_UnidadesMedida_GrupoUnidadMedidaId_EsUnidadBase", schema: "inventario", table: "UnidadesMedida",
            columns: new[] { "GrupoUnidadMedidaId", "EsUnidadBase" }, unique: true, filter: "\"EsUnidadBase\" = true");
        migrationBuilder.CreateIndex(name: "IX_UnidadesMedida_UnidadMedidaBaseId", schema: "inventario", table: "UnidadesMedida", column: "UnidadMedidaBaseId");
        migrationBuilder.CreateIndex(name: "IX_Productos_GrupoUnidadMedidaId", schema: "inventario", table: "Productos", column: "GrupoUnidadMedidaId");
        migrationBuilder.CreateIndex(name: "IX_Productos_UnidadMedidaDefectoId", schema: "inventario", table: "Productos", column: "UnidadMedidaDefectoId");

        migrationBuilder.AddForeignKey(name: "FK_UnidadesMedida_GruposUnidadMedida_GrupoUnidadMedidaId",
            schema: "inventario", table: "UnidadesMedida", column: "GrupoUnidadMedidaId",
            principalSchema: "inventario", principalTable: "GruposUnidadMedida", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_UnidadesMedida_UnidadesMedida_UnidadMedidaBaseId",
            schema: "inventario", table: "UnidadesMedida", column: "UnidadMedidaBaseId",
            principalSchema: "inventario", principalTable: "UnidadesMedida", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Productos_GruposUnidadMedida_GrupoUnidadMedidaId",
            schema: "inventario", table: "Productos", column: "GrupoUnidadMedidaId",
            principalSchema: "inventario", principalTable: "GruposUnidadMedida", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Productos_UnidadesMedida_UnidadMedidaDefectoId",
            schema: "inventario", table: "Productos", column: "UnidadMedidaDefectoId",
            principalSchema: "inventario", principalTable: "UnidadesMedida", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "UnidadMedida", schema: "inventario", table: "Productos",
            type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Unidades");
        migrationBuilder.Sql("""
            UPDATE inventario."Productos" p SET "UnidadMedida" = u."Nombre"
            FROM inventario."UnidadesMedida" u WHERE p."UnidadMedidaDefectoId" = u."Id";
            """);

        migrationBuilder.DropForeignKey(name: "FK_Productos_GruposUnidadMedida_GrupoUnidadMedidaId", schema: "inventario", table: "Productos");
        migrationBuilder.DropForeignKey(name: "FK_Productos_UnidadesMedida_UnidadMedidaDefectoId", schema: "inventario", table: "Productos");
        migrationBuilder.DropForeignKey(name: "FK_UnidadesMedida_GruposUnidadMedida_GrupoUnidadMedidaId", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropForeignKey(name: "FK_UnidadesMedida_UnidadesMedida_UnidadMedidaBaseId", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropIndex(name: "IX_Productos_GrupoUnidadMedidaId", schema: "inventario", table: "Productos");
        migrationBuilder.DropIndex(name: "IX_Productos_UnidadMedidaDefectoId", schema: "inventario", table: "Productos");
        migrationBuilder.DropIndex(name: "IX_UnidadesMedida_GrupoUnidadMedidaId_Nombre", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropIndex(name: "IX_UnidadesMedida_GrupoUnidadMedidaId_EsUnidadBase", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropIndex(name: "IX_UnidadesMedida_UnidadMedidaBaseId", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropColumn(name: "GrupoUnidadMedidaId", schema: "inventario", table: "Productos");
        migrationBuilder.DropColumn(name: "UnidadMedidaDefectoId", schema: "inventario", table: "Productos");
        migrationBuilder.DropColumn(name: "GrupoUnidadMedidaId", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropColumn(name: "EsUnidadBase", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropColumn(name: "UnidadMedidaBaseId", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.DropColumn(name: "FactorConversion", schema: "inventario", table: "UnidadesMedida");
        migrationBuilder.AddColumn<string>(name: "Codigo", schema: "inventario", table: "UnidadesMedida",
            type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<string>(name: "Abreviatura", schema: "inventario", table: "UnidadesMedida",
            type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<string>(name: "Descripcion", schema: "inventario", table: "UnidadesMedida",
            type: "character varying(300)", maxLength: 300, nullable: true);
        migrationBuilder.AddColumn<bool>(name: "PermiteDecimales", schema: "inventario", table: "UnidadesMedida",
            type: "boolean", nullable: false, defaultValue: false);
        migrationBuilder.CreateIndex(name: "IX_UnidadesMedida_Codigo", schema: "inventario",
            table: "UnidadesMedida", column: "Codigo", unique: true);
        migrationBuilder.RenameColumn(name: "EstaActivo", schema: "inventario", table: "UnidadesMedida", newName: "Activo");
        migrationBuilder.DropTable(name: "GruposUnidadMedida", schema: "inventario");
    }
}
